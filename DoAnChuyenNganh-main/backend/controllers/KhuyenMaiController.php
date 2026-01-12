<?php
require_once __DIR__ . "/../config/Database.php";
require_once __DIR__ . "/../models/KhuyenMai.php";
require_once __DIR__ . "/../helper/response.php";

class KhuyenMaiController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = (new Database())->connect();
        $this->model = new KhuyenMai($this->db);
    }

    /** Danh sách */
    public function list()
    {
        $data = $this->model->getAll();
        jsonResponse(true, "Danh sách khuyến mãi", $data);
    }

    /** Chi tiết */
    public function detail()
    {
        $id = $_GET["id"] ?? null;
        if (!$id) jsonResponse(false, "Thiếu ID");

        $data = $this->model->getById($id);
        if (!$data) jsonResponse(false, "Không tìm thấy khuyến mãi");

        jsonResponse(true, "Chi tiết khuyến mãi", $data);
    }

    /** Kiểm tra mã & Tính tiền giảm */
    public function kiemTra()
    {
        $code = $_GET["code"] ?? "";
        $rawTotal = $_GET["total"] ?? 0;
        
        $cleanTotal = preg_replace('/[^\d]/', '', $rawTotal);
        $total = intval($cleanTotal);

        if (!$code) jsonResponse(false, "Vui lòng nhập mã giảm giá");

        $km = $this->model->getByCode($code);

        if (!$km) {
            jsonResponse(false, "Mã giảm giá không tồn tại");
            return;
        }

        if ($km['TrangThai'] != 1) {
            jsonResponse(false, "Mã giảm giá đang bị khóa hoặc chưa kích hoạt");
            return;
        }

        if ($km['SoLuong'] <= 0) {
            jsonResponse(false, "Mã giảm giá đã hết lượt sử dụng");
            return;
        }

        $now = date('Y-m-d');
        if ($km['NgayKetThuc'] && $now > $km['NgayKetThuc']) {
            jsonResponse(false, "Mã giảm giá đã hết hạn");
            return;
        }

        if ($total < $km['DonToiThieu']) {
            jsonResponse(false, "Đơn hàng chưa đạt giá trị tối thiểu: " . number_format($km['DonToiThieu']) . "đ");
            return;
        }

        // Tính toán
        $discount = 0;
        if ($km['LoaiKM'] === 'phantram') {
            $discount = ($total * $km['GiaTri']) / 100;
        } else {
            $discount = $km['GiaTri'];
        }

        if ($discount > $total) $discount = $total; // Không giảm quá tiền đơn

        jsonResponse(true, "Áp dụng thành công", [
            "KhuyenMaiID" => $km["KhuyenMaiID"],
            "GiaTriGiam" => $discount,
            "Code" => $km["Code"]
        ]);
    }

    /** Tạo mới (ĐÃ THÊM VALIDATE SỐ LƯỢNG) */
    public function create()
    {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["Code"]) || empty($input["GiaTri"])) {
            jsonResponse(false, "Thiếu Code hoặc Giá trị");
            return;
        }
        
        // --- CHỈNH SỬA: Validate số âm ---
        if (isset($input["SoLuong"]) && $input["SoLuong"] < 0) {
            jsonResponse(false, "Số lượng không được là số âm!");
            return;
        }
        if (isset($input["GiaTri"]) && $input["GiaTri"] < 0) {
            jsonResponse(false, "Giá trị giảm không được là số âm!");
            return;
        }
        if (isset($input["DonToiThieu"]) && $input["DonToiThieu"] < 0) {
            jsonResponse(false, "Đơn tối thiểu không được là số âm!");
            return;
        }
        // ---------------------------------
        
        if(!isset($input["SoLuong"])) $input["SoLuong"] = 0;
        if(!isset($input["DonToiThieu"])) $input["DonToiThieu"] = 0;
        if(!isset($input["LoaiKM"])) $input["LoaiKM"] = "phantram";
        if(!isset($input["TrangThai"])) $input["TrangThai"] = 1;

        $ok = $this->model->create($input);
        jsonResponse($ok, $ok ? "Thêm mã thành công" : "Mã đã tồn tại hoặc lỗi hệ thống");
    }

    /** Cập nhật (ĐÃ THÊM VALIDATE SỐ LƯỢNG) */
    public function update()
    {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["KhuyenMaiID"])) {
            jsonResponse(false, "Thiếu ID");
            return;
        }
        
        // --- CHỈNH SỬA: Validate số âm ---
        if (isset($input["SoLuong"]) && $input["SoLuong"] < 0) {
            jsonResponse(false, "Số lượng không được là số âm!");
            return;
        }
        if (isset($input["GiaTri"]) && $input["GiaTri"] < 0) {
            jsonResponse(false, "Giá trị giảm không được là số âm!");
            return;
        }
        if (isset($input["DonToiThieu"]) && $input["DonToiThieu"] < 0) {
            jsonResponse(false, "Đơn tối thiểu không được là số âm!");
            return;
        }
        // ---------------------------------
        
        if(!isset($input["TrangThai"])) $input["TrangThai"] = 1;

        $ok = $this->model->update($input);
        jsonResponse($ok, $ok ? "Cập nhật thành công" : "Lỗi cập nhật");
    }

    /** Xóa */
    public function delete()
    {
        $input = json_decode(file_get_contents("php://input"), true);
        $id = $input["KhuyenMaiID"] ?? null;

        if (!$id) {
            jsonResponse(false, "Thiếu ID");
            return;
        }

        $ok = $this->model->delete($id);
        jsonResponse($ok, $ok ? "Xóa thành công" : "Lỗi xóa");
    }
}
?>