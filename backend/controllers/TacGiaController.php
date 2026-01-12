<?php
require_once __DIR__ . "/../models/TacGia.php";
require_once __DIR__ . "/../helper/response.php";

class TacGiaController {

    private $db;
    private $model;

    public function __construct() {
        $this->db = (new Database())->connect();
        $this->model = new TacGia($this->db);
    }

    public function list() {
        $data = $this->model->getAll();
        jsonResponse(true, "Danh sách tác giả", $data);
    }

    // --- SỬA LẠI LOGIC CREATE ---
    public function create() {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["TenTacGia"])) {
            jsonResponse(false, "Tên tác giả không được để trống");
            return;
        }

        $tenTacGia = trim($input["TenTacGia"]);

        // 1. Kiểm tra chặt chẽ xem tác giả đã có chưa
        $existing = $this->model->checkExist($tenTacGia);

        if ($existing) {
            // SỬA: Trả về FALSE để báo lỗi cho Admin biết là bị trùng
            jsonResponse(false, "Tên tác giả '$tenTacGia' đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!");
            return;
        }

        // 2. Nếu chưa có thì tạo mới
        $ok = $this->model->create($tenTacGia);

        if ($ok) {
            $newId = $this->db->lastInsertId();
            jsonResponse(true, "Thêm tác giả thành công!", [
                "TacGiaID" => $newId,
                "TenTacGia" => $tenTacGia
            ]);
        } else {
            jsonResponse(false, "Lỗi hệ thống hoặc tên tác giả bị trùng (DB constraint).");
        }
    }
    // ---------------------------

    public function update() {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["TacGiaID"]) || empty($input["TenTacGia"])) {
            jsonResponse(false, "Thiếu dữ liệu");
            return;
        }

        $id = $input["TacGiaID"];
        $tenMoi = trim($input["TenTacGia"]);

        // Kiểm tra trùng tên khi sửa (loại trừ chính nó)
        $existing = $this->model->checkExist($tenMoi);
        
        if ($existing && $existing['TacGiaID'] != $id) {
            jsonResponse(false, "Không thể đổi tên. Tác giả '$tenMoi' đã tồn tại (ID: " . $existing['TacGiaID'] . ")");
            return;
        }

        $ok = $this->model->update($id, $tenMoi);
        jsonResponse($ok, $ok ? "Cập nhật thành công" : "Cập nhật thất bại (có thể chưa thay đổi gì)");
    }

    public function delete() {
        $input = json_decode(file_get_contents("php://input"), true);
        if (empty($input["TacGiaID"])) { jsonResponse(false, "Thiếu ID"); return; }
        
        // Có thể thêm kiểm tra xem tác giả có sách không trước khi xóa ở đây nếu cần
        
        $ok = $this->model->delete($input["TacGiaID"]);
        jsonResponse($ok, $ok ? "Xóa thành công" : "Xóa thất bại");
    }
}
?>