<?php
require_once __DIR__ . "/../config/Database.php";
require_once __DIR__ . "/../helper/response.php";

class UserController {
    private $db;

    public function __construct() {
        $this->db = (new Database())->connect();
    }

    // 1. Lấy danh sách user
    // Đã xóa 'DiaChi' khỏi câu truy vấn SELECT
    public function list() {
        $role = $_GET['role'] ?? ''; // 'Admin', 'NhanVien', 'KhachHang'
        
        $sql = "SELECT UserID, HoTen, Email, SoDienThoai, VaiTro, TrangThai, NgayTao FROM users";
        if (!empty($role)) {
            $sql .= " WHERE VaiTro = '$role'";
        }
        $sql .= " ORDER BY UserID DESC";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(true, "Danh sách người dùng", $users);
        } catch (Exception $e) {
            jsonResponse(false, "Lỗi: " . $e->getMessage());
        }
    }

    // 2. Tạo tài khoản nội bộ (Admin tạo cho Nhân viên)
    // Đã thêm 'SoDienThoai' vào INSERT và Validate
    public function createInternal() {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Validate dữ liệu đầu vào
        if (empty($data['Email']) || empty($data['MatKhau']) || empty($data['VaiTro']) || empty($data['SoDienThoai'])) {
            jsonResponse(false, "Vui lòng nhập đủ: Email, Mật khẩu, SĐT và Vai trò.");
            return;
        }

        try {
            $hashedPass = password_hash($data['MatKhau'], PASSWORD_DEFAULT);
            
            // Thêm SoDienThoai vào câu lệnh SQL
            $stmt = $this->db->prepare("
                INSERT INTO users (HoTen, Email, SoDienThoai, MatKhau, VaiTro, TrangThai) 
                VALUES (?, ?, ?, ?, ?, 1)
            ");
            
            $stmt->execute([
                $data['HoTen'], 
                $data['Email'], 
                $data['SoDienThoai'], 
                $hashedPass, 
                $data['VaiTro']
            ]);
            
            jsonResponse(true, "Tạo tài khoản thành công");

        } catch (Exception $e) {
            $this->handleDuplicateError($e);
        }
    }

    // 3. Cập nhật thông tin User
    // Xử lý lỗi trùng lặp khi sửa đổi
    public function update() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['UserID'])) {
            jsonResponse(false, "Thiếu ID người dùng");
            return;
        }

        try {
            // Cập nhật Họ tên, Email, SĐT
            $sql = "UPDATE users SET HoTen = ?, Email = ?, SoDienThoai = ? WHERE UserID = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $data['HoTen'],
                $data['Email'],
                $data['SoDienThoai'] ?? null,
                $data['UserID']
            ]);

            jsonResponse(true, "Cập nhật thành công");
        } catch (Exception $e) {
            $this->handleDuplicateError($e);
        }
    }

    // 4. Xóa User
    public function delete() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['UserID'])) {
            jsonResponse(false, "Thiếu ID người dùng cần xóa");
            return;
        }

        try {
            $stmt = $this->db->prepare("DELETE FROM users WHERE UserID = ?");
            $result = $stmt->execute([$data['UserID']]);

            if ($result) {
                jsonResponse(true, "Đã xóa tài khoản thành công");
            } else {
                jsonResponse(false, "Không thể xóa");
            }

        } catch (Exception $e) {
            // Bắt lỗi ràng buộc khóa ngoại (Ví dụ: User đã mua hàng nên không xóa được)
            if (strpos($e->getMessage(), 'Constraint') !== false || strpos($e->getMessage(), '1451') !== false) {
                jsonResponse(false, "Không thể xóa: Tài khoản này đang có dữ liệu đơn hàng hoặc đánh giá.");
            } else {
                jsonResponse(false, "Lỗi: " . $e->getMessage());
            }
        }
    }

    // Hàm phụ trợ: Xử lý thông báo lỗi trùng lặp
    private function handleDuplicateError($e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            if (strpos($e->getMessage(), 'Email')) {
                jsonResponse(false, "Email này đã được sử dụng bởi tài khoản khác!");
            } elseif (strpos($e->getMessage(), 'SoDienThoai') || strpos($e->getMessage(), 'UNIQUE_SDT')) {
                jsonResponse(false, "Số điện thoại này đã được sử dụng bởi tài khoản khác!");
            } else {
                jsonResponse(false, "Thông tin bị trùng lặp trong hệ thống!");
            }
        } else {
            jsonResponse(false, "Lỗi server: " . $e->getMessage());
        }
    }
}
?>