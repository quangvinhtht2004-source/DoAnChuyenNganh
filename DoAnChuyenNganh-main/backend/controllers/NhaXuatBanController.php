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
            return;
        }

        $ten = trim($input["TenNhaXuatBan"]);

        // 1. Kiểm tra trùng tên
        $existing = $this->model->checkExist($ten);
        if ($existing) {
            jsonResponse(false, "Nhà xuất bản '$ten' đã tồn tại. Vui lòng kiểm tra lại!");
            return;
        }

        // 2. Tạo mới
        $ok = $this->model->create($ten);
        if ($ok) {
            jsonResponse(true, "Thêm NXB thành công!");
        } else {
            jsonResponse(false, "Lỗi hệ thống hoặc tên bị trùng.");
        }
    }

    public function update() {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["NhaXuatBanID"]) || empty($input["TenNhaXuatBan"])) {
            jsonResponse(false, "Thiếu dữ liệu");
            return;
        }

        $id = $input["NhaXuatBanID"];
        $tenMoi = trim($input["TenNhaXuatBan"]);

        // Kiểm tra trùng tên (trừ chính ID đang sửa)
        $existing = $this->model->checkExist($tenMoi);
        if ($existing && $existing['NhaXuatBanID'] != $id) {
            jsonResponse(false, "Tên NXB '$tenMoi' đã được sử dụng (ID: " . $existing['NhaXuatBanID'] . ")");
            return;
        }

        $ok = $this->model->update($id, $tenMoi);
        jsonResponse($ok, $ok ? "Cập nhật thành công" : "Lỗi cập nhật");
    }

    public function delete() {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["NhaXuatBanID"])) {
            jsonResponse(false, "Thiếu ID");
            return;
        }

        $ok = $this->model->delete($input["NhaXuatBanID"]);
        jsonResponse($ok, $ok ? "Xóa thành công" : "Xóa thất bại");
    }
}
?>