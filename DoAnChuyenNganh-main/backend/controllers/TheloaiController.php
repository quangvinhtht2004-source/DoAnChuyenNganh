<?php
require_once __DIR__ . "/../config/Database.php";
require_once __DIR__ . "/../models/TheLoai.php";
require_once __DIR__ . "/../helper/response.php";

class TheLoaiController {

    private $db;
    private $model;

    public function __construct() {
        $this->db = (new Database())->connect();
        $this->model = new TheLoai($this->db);
    }

    // LẤY TẤT CẢ (Ai cũng xem được)
    public function list() {
        $data = $this->model->getAll();
        jsonResponse(true, "Danh sách thể loại", $data);
    }

    // THÊM (Chỉ dành cho Admin - Xử lý check quyền ở Frontend hoặc Middleware)
    public function create() {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["TenTheLoai"])) {
            jsonResponse(false, "Tên thể loại không được để trống");
        }

        $result = $this->model->create($input["TenTheLoai"]);
        jsonResponse($result["status"], $result["message"]);
    }

    // SỬA (Chỉ dành cho Admin)
    public function update() {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["TheLoaiID"]) || empty($input["TenTheLoai"])) {
            jsonResponse(false, "Thiếu dữ liệu");
        }

        $result = $this->model->update($input["TheLoaiID"], $input["TenTheLoai"]);
        jsonResponse($result["status"], $result["message"]);
    }

    // XÓA (Chỉ dành cho Admin)
    public function delete() {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["TheLoaiID"])) {
            jsonResponse(false, "Thiếu ID");
        }

        $ok = $this->model->delete($input["TheLoaiID"]);
        jsonResponse($ok, $ok ? "Xóa thành công" : "Xóa thất bại");
    }
}
?>