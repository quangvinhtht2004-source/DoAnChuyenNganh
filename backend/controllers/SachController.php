<?php
require_once __DIR__ . "/../config/Database.php";
require_once __DIR__ . "/../models/Sach.php";
require_once __DIR__ . "/../helper/response.php";

class SachController {

    private $db;
    private $model;

    public function __construct() {
        $this->db = (new Database())->connect();
        $this->model = new Sach($this->db);
    }

    // =================================================================
    // [ĐÃ SỬA] HÀM LIST MỚI - LẤY TOÀN BỘ SÁCH (KHÔNG BỊ LỌC ẨN)
    // =================================================================
    public function list() {
        try {
            // Cố gắng lấy từ VIEW để có đủ tên Tác giả, Thể loại...
            // Lệnh này KHÔNG có 'WHERE TrangThai = 1' nên sẽ hiện cả sách Ngừng bán
            $sql = "SELECT * FROM View_Sach_ChiTiet ORDER BY SachID ASC"; 
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            $list = $stmt->fetchAll(PDO::FETCH_ASSOC);

            jsonResponse(true, "Danh sách sách (Full)", $list);

        } catch (Exception $e) {
            // Fallback: Nếu View chưa được tạo trong Database, lấy từ bảng gốc Sach
            try {
                $sql = "SELECT * FROM Sach ORDER BY SachID ASC";
                $stmt = $this->db->prepare($sql);
                $stmt->execute();
                $list = $stmt->fetchAll(PDO::FETCH_ASSOC);
                jsonResponse(true, "Danh sách sách (Gốc)", $list);
            } catch (Exception $ex) {
                jsonResponse(false, "Lỗi Server: " . $ex->getMessage());
            }
        }
    }

    // =================================================================
    // CÁC HÀM KHÁC GIỮ NGUYÊN NHƯ CŨ
    // =================================================================

    public function detail() {
        $id = $_GET["id"] ?? 0;
        
        // 1. Lấy thông tin cơ bản của sách
        $sach = $this->model->getById($id);

        if ($sach) {
            // 2. Lấy danh sách ảnh phụ
            try {
                $sql = "SELECT TenFileAnh FROM hinhanhsach WHERE SachID = ?";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([$id]);
                $listAnh = $stmt->fetchAll(PDO::FETCH_COLUMN);
                $sach['DanhSachAnh'] = $listAnh;
            } catch (Exception $e) {
                $sach['DanhSachAnh'] = [];
            }
            jsonResponse(true, "Chi tiết sách", $sach);
        } else {
            jsonResponse(false, "Không tìm thấy sách");
        }
    }

    public function search() {
        $keyword = $_GET["keyword"] ?? "";
        $result = $this->model->search($keyword);
        jsonResponse(true, "Kết quả", $result);
    }

    public function newArrivals() {
        jsonResponse(true, "Sách mới", $this->model->getNewArrivals());
    }

    public function bestSellers() {
        jsonResponse(true, "Bán chạy", $this->model->getBestSellers());
    }

    public function getByTheLoai() {
        $ids = $_GET["ids"] ?? ""; 

        if (empty($ids)) {
            jsonResponse(true, "Chưa chọn danh mục", []);
            return;
        }

        $data = $this->model->getByTheLoai($ids);

        if ($data) {
            jsonResponse(true, "Danh sách sách theo thể loại", $data);
        } else {
            jsonResponse(true, "Không tìm thấy sách nào", []);
        }
    }

    // --- HÀM HELPER ---
    private function parseID($value) {
        if (empty($value) || $value == 0) {
            return null;
        }
        return intval($value);
    }

    // --- CÁC HÀM GHI (CREATE/UPDATE/DELETE) ---

    public function create() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['TenSach']) || !isset($data['Gia'])) {
            jsonResponse(false, "Tên sách và Giá là bắt buộc!");
            return;
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO Sach (TenSach, TacGiaID, TheLoaiID, NhaXuatBanID, 
                                  Gia, PhanTramGiam, SoLuong, AnhBia, MoTa, TrangThai)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $result = $stmt->execute([
                $data['TenSach'],
                $this->parseID($data['TacGiaID'] ?? null),
                $this->parseID($data['TheLoaiID'] ?? null),
                $this->parseID($data['NhaXuatBanID'] ?? null),
                floatval($data['Gia']),
                intval($data['PhanTramGiam'] ?? 0),
                intval($data['SoLuong'] ?? 0),
                $data['AnhBia'] ?? '',
                $data['MoTa'] ?? '',
                intval($data['TrangThai'] ?? 1)
            ]);

            if ($result) {
                jsonResponse(true, "Thêm sách thành công");
            } else {
                $error = $stmt->errorInfo();
                jsonResponse(false, "Lỗi SQL: " . $error[2]);
            }

        } catch (Exception $e) {
            jsonResponse(false, "Lỗi Server: " . $e->getMessage());
        }
    }

    public function update() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['SachID']) || empty($data['TenSach'])) {
            jsonResponse(false, "Thiếu ID hoặc Tên sách");
            return;
        }

        try {
            $stmt = $this->db->prepare("
                UPDATE Sach SET
                    TenSach = ?,
                    TacGiaID = ?,
                    TheLoaiID = ?,
                    NhaXuatBanID = ?,
                    Gia = ?,
                    PhanTramGiam = ?,
                    SoLuong = ?,
                    AnhBia = ?,
                    MoTa = ?,
                    TrangThai = ?
                WHERE SachID = ?
            ");

            $result = $stmt->execute([
                $data['TenSach'],
                $this->parseID($data['TacGiaID'] ?? null),
                $this->parseID($data['TheLoaiID'] ?? null),
                $this->parseID($data['NhaXuatBanID'] ?? null),
                floatval($data['Gia']),
                intval($data['PhanTramGiam'] ?? 0),
                intval($data['SoLuong'] ?? 0),
                $data['AnhBia'] ?? '',
                $data['MoTa'] ?? '',
                intval($data['TrangThai'] ?? 1),
                intval($data['SachID'])
            ]);

            if ($result) {
                jsonResponse(true, "Cập nhật thành công");
            } else {
                $error = $stmt->errorInfo();
                jsonResponse(false, "Lỗi SQL Update: " . $error[2]);
            }

        } catch (Exception $e) {
            jsonResponse(false, "Lỗi Server: " . $e->getMessage());
        }
    }

    public function delete() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['SachID'])) {
            jsonResponse(false, "Thiếu ID sách");
            return;
        }

        try {
            $stmt = $this->db->prepare("DELETE FROM Sach WHERE SachID = ?");
            $result = $stmt->execute([intval($data['SachID'])]);

            if ($result) {
                jsonResponse(true, "Đã xóa sách vĩnh viễn");
            } else {
                jsonResponse(false, "Xóa thất bại");
            }

        } catch (Exception $e) {
            if (strpos($e->getMessage(), '1451') !== false || strpos($e->getMessage(), 'Constraint') !== false) {
                 jsonResponse(false, "Không thể xóa: Sách này đang có trong đơn hàng!");
            } else {
                 jsonResponse(false, "Lỗi: " . $e->getMessage());
            }
        }
    }
}
?>