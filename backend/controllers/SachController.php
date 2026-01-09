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

    // --- API: Lấy danh sách (Admin) ---
    public function list() {
        try {
            $list = $this->model->getAllAdmin();
            jsonResponse(true, "Danh sách sách", $list);
        } catch (Exception $e) {
            jsonResponse(false, "Lỗi Server: " . $e->getMessage());
        }
    }

    // --- API: Chi tiết sách ---
    public function detail() {
        $id = $_GET["id"] ?? 0;
        $sach = $this->model->getById($id);

        if ($sach) {
            jsonResponse(true, "Chi tiết sách", $sach);
        } else {
            jsonResponse(false, "Không tìm thấy sách");
        }
    }

    // --- API: Thêm sách mới ---
    public function create() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['TenSach']) || !isset($data['Gia'])) {
            jsonResponse(false, "Tên sách và Giá là bắt buộc!");
            return;
        }

        $tenSach = trim($data['TenSach']);

        // [CHECK TRÙNG TÊN]
        $existing = $this->model->checkExist($tenSach);
        if ($existing) {
            jsonResponse(false, "Tên sách '$tenSach' đã tồn tại trong hệ thống. Vui lòng đặt tên khác!");
            return;
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO Sach (TenSach, TacGiaID, TheLoaiID, NhaXuatBanID, 
                                  Gia, PhanTramGiam, SoLuong, AnhBia, AnhPhu1, AnhPhu2, MoTa, TrangThai)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $result = $stmt->execute([
                $tenSach,
                !empty($data['TacGiaID']) ? intval($data['TacGiaID']) : null,
                !empty($data['TheLoaiID']) ? intval($data['TheLoaiID']) : null,
                !empty($data['NhaXuatBanID']) ? intval($data['NhaXuatBanID']) : null,
                floatval($data['Gia']),
                intval($data['PhanTramGiam'] ?? 0),
                intval($data['SoLuong'] ?? 0),
                $data['AnhBia'] ?? '',
                $data['AnhPhu1'] ?? '', 
                $data['AnhPhu2'] ?? '', 
                $data['MoTa'] ?? '',
                intval($data['TrangThai'] ?? 1)
            ]);

            if ($result) {
                jsonResponse(true, "Thêm sách thành công");
            } else {
                jsonResponse(false, "Lỗi SQL: Không thể thêm sách");
            }

        } catch (Exception $e) {
            jsonResponse(false, "Lỗi Server: " . $e->getMessage());
        }
    }

    // --- API: Cập nhật sách ---
    public function update() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['SachID'])) {
            jsonResponse(false, "Thiếu ID sách");
            return;
        }

        $id = intval($data['SachID']);
        $tenSach = trim($data['TenSach']);

        // [CHECK TRÙNG TÊN] - Ngoại trừ chính nó
        $existing = $this->model->checkExist($tenSach);
        if ($existing && $existing['SachID'] != $id) {
            jsonResponse(false, "Tên sách '$tenSach' đã được sử dụng bởi ID #" . $existing['SachID']);
            return;
        }

        try {
            $stmt = $this->db->prepare("
                UPDATE Sach SET
                    TenSach = ?, TacGiaID = ?, TheLoaiID = ?, NhaXuatBanID = ?,
                    Gia = ?, PhanTramGiam = ?, SoLuong = ?,
                    AnhBia = ?, AnhPhu1 = ?, AnhPhu2 = ?, 
                    MoTa = ?, TrangThai = ?
                WHERE SachID = ?
            ");

            $result = $stmt->execute([
                $tenSach,
                !empty($data['TacGiaID']) ? intval($data['TacGiaID']) : null,
                !empty($data['TheLoaiID']) ? intval($data['TheLoaiID']) : null,
                !empty($data['NhaXuatBanID']) ? intval($data['NhaXuatBanID']) : null,
                floatval($data['Gia']),
                intval($data['PhanTramGiam'] ?? 0),
                intval($data['SoLuong'] ?? 0),
                $data['AnhBia'] ?? '',
                $data['AnhPhu1'] ?? '', 
                $data['AnhPhu2'] ?? '', 
                $data['MoTa'] ?? '',
                intval($data['TrangThai'] ?? 1),
                $id
            ]);

            if ($result) {
                jsonResponse(true, "Cập nhật thành công");
            } else {
                jsonResponse(false, "Lỗi cập nhật SQL");
            }

        } catch (Exception $e) {
            jsonResponse(false, "Lỗi Server: " . $e->getMessage());
        }
    }

    // --- API: Xóa sách ---
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
            // Xử lý lỗi khóa ngoại (nếu sách đã có trong đơn hàng)
            if (strpos($e->getMessage(), '1451') !== false || strpos($e->getMessage(), 'Constraint') !== false) {
                 jsonResponse(false, "Không thể xóa: Sách này đang có trong đơn hàng!");
            } else {
                 jsonResponse(false, "Lỗi: " . $e->getMessage());
            }
        }
    }

    // --- API: Public (Search, Filter...) ---
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
        if (empty($ids)) { jsonResponse(true, "Chưa chọn danh mục", []); return; }
        $data = $this->model->getByTheLoai($ids);
        jsonResponse(true, "Danh sách", $data ?: []);
    }
}
?>