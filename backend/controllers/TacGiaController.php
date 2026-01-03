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

    public function create() {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["TenTacGia"])) {
            jsonResponse(false, "Tên tác giả không được để trống");
        }

        $ok = $this->model->create($input["TenTacGia"]);
        jsonResponse($ok, $ok ? "Thêm thành công" : "Thêm thất bại");
    }

    public function update() {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["TacGiaID"]) || empty($input["TenTacGia"])) {
            jsonResponse(false, "Thiếu dữ liệu");
        }

        $ok = $this->model->update($input["TacGiaID"], $input["TenTacGia"]);
        jsonResponse($ok, $ok ? "Sửa thành công" : "Sửa thất bại");
    }

    public function delete() {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["TacGiaID"])) {
            jsonResponse(false, "Thiếu ID");
        }

        $ok = $this->model->delete($input["TacGiaID"]);
        jsonResponse($ok, $ok ? "Xóa thành công" : "Xóa thất bại");
    }
}
?>
