<?php
require_once __DIR__ . "/../config/Database.php";
require_once __DIR__ . "/../models/DonHang.php";
require_once __DIR__ . "/../models/ChiTietDonHang.php";
require_once __DIR__ . "/../models/GioHang.php";
require_once __DIR__ . "/../models/GioHangItem.php";
require_once __DIR__ . "/../models/KhuyenMai.php";
require_once __DIR__ . "/../models/Sach.php";
require_once __DIR__ . "/../helper/response.php";

class DonHangController {
    private $db, $donHangModel, $chiTietModel, $gioHangModel, $itemModel, $kmModel, $sachModel;

    public function __construct() {
        $this->db           = (new Database())->connect();
        $this->donHangModel = new DonHang($this->db);
        $this->chiTietModel = new ChiTietDonHang($this->db);
        $this->gioHangModel = new GioHang($this->db);
        $this->itemModel    = new GioHangItem($this->db);
        $this->kmModel      = new KhuyenMai($this->db);
        $this->sachModel    = new Sach($this->db);
    }

    // --- API: Lấy danh sách đơn hàng ---
    public function list() {
        try {
            $stmt = $this->db->prepare("
                SELECT d.*, u.HoTen as NguoiDat 
                FROM DonHang d
                LEFT JOIN users u ON d.UserID = u.UserID
                ORDER BY d.DonHangID DESC
            ");
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(true, "Danh sách đơn hàng", $data);
        } catch (Exception $e) {
            jsonResponse(false, "Lỗi: " . $e->getMessage());
        }
    }

    // --- API: Xem chi tiết đơn hàng ---
    public function detail() {
        $id = $_GET["id"] ?? null;
        if (!$id) {
            jsonResponse(false, "Thiếu ID đơn hàng"); return;
        }
        try {
            $stmt = $this->db->prepare("
                SELECT ct.*, s.TenSach, s.AnhBia
                FROM ChiTietDonHang ct
                INNER JOIN Sach s ON ct.SachID = s.SachID
                WHERE ct.DonHangID = ?
            ");
            $stmt->execute([$id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(true, "Chi tiết đơn hàng", $data);
        } catch (Exception $e) {
            jsonResponse(false, "Lỗi: " . $e->getMessage());
        }
    }

    // --- API: TẠO ĐƠN HÀNG ---
    public function create() {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $userId = $data['UserID'] ?? ($data['KhachHangID'] ?? null);

        if (empty($userId)) {
            jsonResponse(false, "Vui lòng đăng nhập để đặt hàng!"); 
            return;
        }

        // 1. Lấy giỏ hàng
        $cart  = $this->gioHangModel->getOrCreate($userId);
        $items = $this->itemModel->getItems($cart['GioHangID']);

        if (!$items || count($items) === 0) {
            jsonResponse(false, "Giỏ hàng trống!"); 
            return;
        }

        // 2. Tính tổng tiền tạm tính
        $tamTinh = 0;
        foreach ($items as $item) {
            $tamTinh += $item['GiaBan'] * $item['SoLuong'];
        }

        // 3. Xử lý khuyến mãi
        $coupon = $data['MaGiamGia'] ?? "";
        $giam = 0; 
        $kmId = null;

        if ($coupon !== "") {
            $km = $this->kmModel->getByCode($coupon);

            if ($km) {
                $now = time();
                $ngayBatDau = strtotime($km['NgayBatDau']);
                $ngayKetThuc = $km['NgayKetThuc'] ? strtotime($km['NgayKetThuc']) : null;

                if ($km['TrangThai'] == 1 && 
                    $km['SoLuong'] > 0 &&
                    $now >= $ngayBatDau && 
                    ($ngayKetThuc === null || $now <= $ngayKetThuc) &&
                    $tamTinh >= $km["DonToiThieu"]
                ) {
                    $giam = $km["LoaiKM"] === "phantram" ? $tamTinh * ($km["GiaTri"] / 100) : $km["GiaTri"];
                    if ($giam > $tamTinh) $giam = $tamTinh;
                    $kmId = $km["KhuyenMaiID"];
                }
            }
        }
        
        $tongTien = $tamTinh - $giam;
        if ($tongTien < 0) $tongTien = 0;

        // 4. Chuẩn bị thông tin lưu DB
        $hoTenNguoiNhan = $data['HoTenNguoiNhan'] ?? 'Khách';
        $ghiChuKhach    = $data['GhiChu'] ?? '';
        $ghiChuLuuDB    = "Người nhận: " . $hoTenNguoiNhan . ". Note: " . $ghiChuKhach;

        $diaChi         = $data['DiaChiGiao'] ?? '';
        $sdt            = $data['SoDienThoai'] ?? '';
        $phuongThuc     = $data['PhuongThucTT'] ?? 'COD';

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO DonHang (UserID, DiaChiGiao, SoDienThoai, GhiChu, PhuongThucTT, TongTien, TienGiamVoucher, KhuyenMaiID, TrangThai, NgayTao)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ChoXacNhan', NOW())
            ");
            
            $stmt->execute([$userId, $diaChi, $sdt, $ghiChuLuuDB, $phuongThuc, $tongTien, $giam, $kmId]);
            $donHangID = $this->db->lastInsertId();

            foreach ($items as $item) {
                $this->chiTietModel->add($donHangID, $item["SachID"], $item["SoLuong"], $item["GiaBan"]);
                $this->sachModel->updateStock($item["SachID"], $item["SoLuong"]);
            }

            if ($kmId) {
                $this->kmModel->decreaseQuantity($kmId);
            }

            $this->gioHangModel->clearCart($cart["GioHangID"]);
            $this->db->commit();
            jsonResponse(true, "Đặt hàng thành công!", ["DonHangID" => $donHangID]);

        } catch (Exception $e) {
            $this->db->rollBack();
            jsonResponse(false, "Lỗi Server: " . $e->getMessage());
        }
    }

    // ============================================================
    // [QUAN TRỌNG] HÀM BẠN ĐANG THIẾU -> COPY ĐOẠN NÀY VÀO
    // ============================================================
    public function updateStatus() {
        // Nhận dữ liệu JSON
        $data = json_decode(file_get_contents("php://input"), true);

        // Lấy tham số
        $id = $data['DonHangID'] ?? null;
        $status = $data['TrangThai'] ?? null;

        // Kiểm tra
        if (!$id || !$status) {
            jsonResponse(false, "Thiếu ID hoặc Trạng thái đơn hàng");
            return;
        }

        try {
            // Cập nhật Database
            $stmt = $this->db->prepare("UPDATE DonHang SET TrangThai = ? WHERE DonHangID = ?");
            
            if ($stmt->execute([$status, $id])) {
                jsonResponse(true, "Cập nhật trạng thái thành công!");
            } else {
                jsonResponse(false, "Không thể cập nhật trạng thái (Lỗi SQL)");
            }
        } catch (Exception $e) {
            jsonResponse(false, "Lỗi Server: " . $e->getMessage());
        }
    }
}
?>