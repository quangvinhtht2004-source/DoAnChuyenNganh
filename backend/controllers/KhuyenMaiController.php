<?php
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

    /** * Kiểm tra mã & Tính tiền giảm 
     * Đã thêm hàm làm tròn số (round) để tránh số lẻ thập phân
     */
    public function kiemTra()
    {
        $code = $_GET["code"] ?? "";
        
        // --- Xử lý input tiền ---
        $rawTotal = $_GET["total"] ?? 0;
        // Chỉ giữ lại số, bỏ các ký tự khác để đảm bảo tính toán đúng
        $cleanTotal = preg_replace('/[^\d]/', '', $rawTotal);
        $tongTien = (float) $cleanTotal;
        // ------------------------
        
        if (empty($code)) {
            jsonResponse(false, "Vui lòng nhập mã giảm giá");
        }

        // Lấy thông tin mã
        $voucher = $this->model->getByCode(strtoupper($code));
        
        if (!$voucher) {
            jsonResponse(false, "Mã giảm giá không tồn tại");
        }

        // 1. Kiểm tra số lượng
        if ($voucher["SoLuong"] <= 0) {
            jsonResponse(false, "Mã này đã hết lượt sử dụng");
        }

        // 2. Kiểm tra hạn sử dụng
        if (!empty($voucher["NgayKetThuc"])) {
            $today = date("Y-m-d"); 
            $endDate = date("Y-m-d", strtotime($voucher["NgayKetThuc"]));
            if ($today > $endDate) {
                jsonResponse(false, "Mã giảm giá đã hết hạn vào ngày $endDate");
            }
        }

        // 3. Kiểm tra đơn hàng tối thiểu
        if ($tongTien < $voucher["DonToiThieu"]) {
            $thieu = number_format($voucher["DonToiThieu"] - $tongTien, 0, ',', '.');
            $min = number_format($voucher["DonToiThieu"], 0, ',', '.');
            jsonResponse(false, "Đơn chưa đủ điều kiện (Tối thiểu $min đ). Mua thêm $thieu đ để dùng mã.");
        }

        // --- TÍNH TOÁN SỐ TIỀN GIẢM (Server tính luôn cho chắc) ---
        $tienGiam = 0;
        if ($voucher['LoaiKM'] == 'tien') {
            $tienGiam = (float)$voucher['GiaTri'];
        } else {
            // Là phần trăm: Tính toán và LÀM TRÒN SỐ (round)
            // Ví dụ: 152.250 * 15% = 22.837,5 -> Làm tròn thành 22.838
            $tienGiam = round($tongTien * ((float)$voucher['GiaTri'] / 100));
        }

        // Không giảm quá tổng tiền đơn hàng
        if ($tienGiam > $tongTien) {
            $tienGiam = $tongTien;
        }

        // Trả về kết quả
        jsonResponse(true, "Áp dụng thành công", [
            'info' => $voucher,         // Thông tin gốc
            'tien_giam' => $tienGiam,   // Số tiền được giảm (đã làm tròn)
            'tong_tien_sau_giam' => $tongTien - $tienGiam
        ]);
    }

    /** Tạo mới */
    public function create()
    {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["Code"]) || empty($input["GiaTri"])) {
            jsonResponse(false, "Thiếu Code hoặc Giá trị");
        }
        
        if(!isset($input["SoLuong"])) $input["SoLuong"] = 0;
        if(!isset($input["DonToiThieu"])) $input["DonToiThieu"] = 0;
        if(!isset($input["LoaiKM"])) $input["LoaiKM"] = "phantram"; 

        $ok = $this->model->create($input);
        jsonResponse($ok, $ok ? "Thêm mã thành công" : "Mã đã tồn tại hoặc lỗi hệ thống");
    }

    /** Cập nhật */
    public function update()
    {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["KhuyenMaiID"])) {
            jsonResponse(false, "Thiếu ID");
        }

        $ok = $this->model->update($input);
        jsonResponse($ok, $ok ? "Cập nhật thành công" : "Lỗi cập nhật");
    }

    /** Xóa */
    public function delete()
    {
        $input = json_decode(file_get_contents("php://input"), true);

        if (empty($input["KhuyenMaiID"])) {
            jsonResponse(false, "Thiếu ID");
        }

        $ok = $this->model->delete($input["KhuyenMaiID"]);
        jsonResponse($ok, $ok ? "Đã xóa mã giảm giá" : "Lỗi khi xóa");
    }
}
?>