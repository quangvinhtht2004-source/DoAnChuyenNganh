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
                $ngayKetThuc = $km['NgayKetThuc'] ? strtotime($km['NgayKetThuc']) : null;

                if ($km['TrangThai'] == 1 && 
                    $km['SoLuong'] > 0 &&
                    ($ngayKetThuc === null || $now <= $ngayKetThuc) &&
                    $tamTinh >= $km["DonToiThieu"]
                ) {
                    if ($km["LoaiKM"] === "phantram") {
                        $giam = round($tamTinh * ($km["GiaTri"] / 100));
                    } else {
                        $giam = $km["GiaTri"];
                    }

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

            // Insert Đơn hàng
            $stmt = $this->db->prepare("
                INSERT INTO DonHang (UserID, DiaChiGiao, SoDienThoai, GhiChu, PhuongThucTT, TongTien, TienGiamVoucher, KhuyenMaiID, TrangThai, NgayTao)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ChoXacNhan', NOW())
            ");
            
            $stmt->execute([$userId, $diaChi, $sdt, $ghiChuLuuDB, $phuongThuc, $tongTien, $giam, $kmId]);
            $donHangID = $this->db->lastInsertId();

            // Insert Chi tiết & Trừ kho
            foreach ($items as $item) {
                $this->chiTietModel->add($donHangID, $item["SachID"], $item["SoLuong"], $item["GiaBan"]);
                // Trừ tồn kho
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
    // CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (ĐÃ BỔ SUNG HOÀN KHO & HOÀN MÃ)
    // ============================================================
    public function updateStatus() {
        $data = json_decode(file_get_contents("php://input"), true);

        $id = $data['DonHangID'] ?? null;
        $newStatus = $data['TrangThai'] ?? null;

        if (!$id || !$newStatus) {
            jsonResponse(false, "Thiếu thông tin cần thiết");
            return;
        }

        try {
            // 1. Lấy trạng thái hiện tại VÀ KhuyenMaiID (Quan trọng)
            $stmtCheck = $this->db->prepare("SELECT TrangThai, KhuyenMaiID FROM DonHang WHERE DonHangID = ?");
            $stmtCheck->execute([$id]);
            $currentOrder = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if (!$currentOrder) {
                jsonResponse(false, "Đơn hàng không tồn tại");
                return;
            }
            
            $oldStatus = $currentOrder['TrangThai'];

            // 2. Ràng buộc logic
            if ($oldStatus === 'HoanThanh') {
                jsonResponse(false, "Đơn hàng đã hoàn thành, không thể thay đổi.");
                return;
            }
            if ($oldStatus === 'DaHuy') {
                jsonResponse(false, "Đơn hàng này đã bị hủy trước đó.");
                return;
            }

            // --- LOGIC HỦY ĐƠN ---
            if ($newStatus === 'DaHuy') {
                // Chỉ cho phép hủy khi đang chờ xác nhận
                if ($oldStatus !== 'ChoXacNhan') {
                    jsonResponse(false, "Đơn hàng đang xử lý hoặc đang giao, không thể hủy lúc này!");
                    return;
                }

                // A. CỘNG LẠI SỐ LƯỢNG SÁCH VÀO KHO
                $stmtItems = $this->db->prepare("SELECT SachID, SoLuong FROM ChiTietDonHang WHERE DonHangID = ?");
                $stmtItems->execute([$id]);
                $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

                if ($items) {
                    foreach ($items as $item) {
                        $stmtRestock = $this->db->prepare("UPDATE Sach SET SoLuong = SoLuong + ? WHERE SachID = ?");
                        $stmtRestock->execute([$item['SoLuong'], $item['SachID']]);
                    }
                }

                // B. [MỚI] HOÀN TRẢ SỐ LƯỢNG MÃ KHUYẾN MÃI (NẾU CÓ)
                if (!empty($currentOrder['KhuyenMaiID'])) {
                    $this->kmModel->restoreQuantity($currentOrder['KhuyenMaiID']);
                }
            }

            // 3. Cập nhật trạng thái
            $stmt = $this->db->prepare("UPDATE DonHang SET TrangThai = ? WHERE DonHangID = ?");
            
            if ($stmt->execute([$newStatus, $id])) {
                jsonResponse(true, "Cập nhật trạng thái thành công!");
            } else {
                jsonResponse(false, "Lỗi hệ thống: Không thể cập nhật");
            }
        } catch (Exception $e) {
            jsonResponse(false, "Lỗi Server: " . $e->getMessage());
        }
    }

    // --- API: Lấy lịch sử đơn hàng của 1 User ---
    public function history() {
        $userId = $_GET['userId'] ?? null;

        if (!$userId) {
            jsonResponse(false, "Thiếu UserID");
            return;
        }

        try {
            $orders = $this->donHangModel->getByUser($userId);
            jsonResponse(true, "Lịch sử đơn hàng", $orders);
        } catch (Exception $e) {
            jsonResponse(false, "Lỗi: " . $e->getMessage());
        }
    }
}
?>