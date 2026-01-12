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

        // 1. Validate Tên sách
        if (empty($data['TenSach'])) {
            jsonResponse(false, "Tên sách là bắt buộc!"); return;
        }

        // 2. Validate Giá bán (> 0)
        if (empty($data['Gia']) || floatval($data['Gia']) <= 0) {
            jsonResponse(false, "Giá bán phải lớn hơn 0!"); return;
        }

        // 3. Validate Giảm giá (0 - 50%)
        $giamGia = intval($data['PhanTramGiam'] ?? 0);
        if ($giamGia < 0 || $giamGia > 50) {
            jsonResponse(false, "Giảm giá chỉ được phép từ 0% đến 50%!"); return;
        }

        // 4. Validate Tồn kho (>= 0)
        $soLuong = intval($data['SoLuong'] ?? 0);
        if ($soLuong < 0) {
            jsonResponse(false, "Số lượng tồn kho không được âm!"); return;
        }

        // 5. Validate Trùng tên
        // Lưu ý: Cần đảm bảo Model Sach.php đã có hàm checkName như tôi đã sửa ở bước trước
        if ($this->model->checkName($data['TenSach'])) {
            jsonResponse(false, "Tên sách '$data[TenSach]' đã tồn tại! Vui lòng đặt tên khác."); 
            return;
        }

        try {
            // Gọi hàm create từ Model để code gọn hơn
            if ($this->model->create($data)) {
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
            jsonResponse(false, "Thiếu ID sách"); return;
        }

        // 1. Validate Tên sách
        if (empty($data['TenSach'])) {
            jsonResponse(false, "Tên sách là bắt buộc!"); return;
        }

        // 2. Validate Giá bán (> 0)
        if (empty($data['Gia']) || floatval($data['Gia']) <= 0) {
            jsonResponse(false, "Giá bán phải lớn hơn 0!"); return;
        }

        // 3. Validate Giảm giá (0 - 50%)
        $giamGia = intval($data['PhanTramGiam'] ?? 0);
        if ($giamGia < 0 || $giamGia > 50) {
            jsonResponse(false, "Giảm giá chỉ được phép từ 0% đến 50%!"); return;
        }

        // 4. Validate Tồn kho (>= 0)
        $soLuong = intval($data['SoLuong'] ?? 0);
        if ($soLuong < 0) {
            jsonResponse(false, "Số lượng tồn kho không được âm!"); return;
        }

        // 5. Validate Trùng tên (Loại trừ chính ID đang sửa)
        if ($this->model->checkName($data['TenSach'], $data['SachID'])) {
            jsonResponse(false, "Tên sách '$data[TenSach]' đã tồn tại!"); 
            return;
        }

        try {
            // Gọi hàm update từ Model
            if ($this->model->update($data)) {
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
            jsonResponse(false, "Thiếu ID sách"); return;
        }

        try {
            // Gọi hàm delete từ Model
            if ($this->model->delete(intval($data['SachID']))) {
                jsonResponse(true, "Đã xóa sách vĩnh viễn");
            } else {
                jsonResponse(false, "Xóa thất bại (Sách có thể không tồn tại)");
            }

        } catch (Exception $e) {
            // Xử lý lỗi khóa ngoại (nếu sách đã có trong đơn hàng - mã lỗi 23000/1451)
            if (strpos($e->getMessage(), '1451') !== false || strpos($e->getMessage(), 'Constraint') !== false) {
                 jsonResponse(false, "Không thể xóa: Sách này đang có trong đơn hàng hoặc giỏ hàng!");
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