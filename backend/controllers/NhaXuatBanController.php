<?php
require_once __DIR__ . "/../models/NhaXuatBan.php";
require_once __DIR__ . "/../helper/response.php";

class NhaXuatBanController {

    private $db;
    private $model;

    public function __construct() {
        $this->db = (new Database())->connect();
        $this->model = new NhaXuatBan($this->db);
    }

    public function list() {
        $data = $this->model->getAll();
        jsonResponse(true, "Danh sách NXB", $data);
    }

    public function create() {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["TenNhaXuatBan"])) {
            jsonResponse(false, "Tên NXB không được để trống");
        }

        $result = $this->model->create($input["TenNhaXuatBan"]);
        jsonResponse($result["status"], $result["message"]);
    }

    public function update() {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["NhaXuatBanID"]) || empty($input["TenNhaXuatBan"])) {
            jsonResponse(false, "Thiếu dữ liệu");
        }

        $result = $this->model->update($input["NhaXuatBanID"], $input["TenNhaXuatBan"]);
        jsonResponse($result["status"], $result["message"]);
    }

    public function delete() {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["NhaXuatBanID"])) {
            jsonResponse(false, "Thiếu ID");
        }

        $ok = $this->model->delete($input["NhaXuatBanID"]);
        jsonResponse($ok, $ok ? "Xóa thành công" : "Xóa thất bại");
    }
}
