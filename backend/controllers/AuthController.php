<?php
// backend/controllers/AuthController.php

require_once __DIR__ . "/../config/Database.php";
require_once __DIR__ . "/../models/User.php"; 
require_once __DIR__ . "/../helper/response.php";

class AuthController {
    private $db;

    public function __construct() {
        $this->db = (new Database())->connect();
    }

    /** =================================
     * ĐĂNG KÝ (Hỗ trợ cả Khách Hàng & Admin)
     * ================================= */
    public function register() {
        $data = json_decode(file_get_contents("php://input"), true);

        // 1. Validate dữ liệu cơ bản
        if (empty($data['HoTen']) || empty($data['Email']) || empty($data['MatKhau'])) {
            jsonResponse(false, "Vui lòng nhập đầy đủ thông tin");
            return;
        }

        if (!filter_var($data['Email'], FILTER_VALIDATE_EMAIL)) {
            jsonResponse(false, "Email không hợp lệ");
            return;
        }

        // 2. Xử lý Vai Trò & Mã Bí Mật
        $vaiTro = 'KhachHang'; // Mặc định là khách hàng
        
        // Nếu yêu cầu đăng ký là Admin
        if (isset($data['VaiTro']) && $data['VaiTro'] === 'QuanTri') {
            $secretKey = $data['SecretKey'] ?? '';
            
            // --- CẤU HÌNH MÃ BÍ MẬT TẠI ĐÂY ---
            if ($secretKey === '111') { 
                $vaiTro = 'QuanTri';
            } else {
                jsonResponse(false, "Mã bí mật quản trị không chính xác!");
                return;
            }
        }

        try {
            // 3. Kiểm tra email trùng
            $stmt = $this->db->prepare("SELECT UserID FROM users WHERE Email = ?");
            $stmt->execute([$data['Email']]);
            if ($stmt->fetch()) {
                jsonResponse(false, "Email này đã được đăng ký");
                return;
            }
            
            // 3b. Kiểm tra SĐT trùng (Thêm bước này để báo lỗi rõ hơn trước khi Insert)
            if (!empty($data['DienThoai'])) {
                $stmtPhone = $this->db->prepare("SELECT UserID FROM users WHERE SoDienThoai = ?");
                $stmtPhone->execute([$data['DienThoai']]);
                if ($stmtPhone->fetch()) {
                    jsonResponse(false, "Số điện thoại này đã được sử dụng");
                    return;
                }
            } else {
                jsonResponse(false, "Vui lòng nhập số điện thoại");
                return;
            }

            // 4. Hash mật khẩu
            $hashedPass = password_hash($data['MatKhau'], PASSWORD_DEFAULT);

            // 5. Insert vào Database
            // ĐÃ SỬA: Xóa 'DiaChi' khỏi câu lệnh INSERT
            $stmt = $this->db->prepare("
                INSERT INTO users (HoTen, Email, MatKhau, SoDienThoai, VaiTro, TrangThai) 
                VALUES (?, ?, ?, ?, ?, 1)
            ");
            
            $result = $stmt->execute([
                $data['HoTen'],
                $data['Email'],
                $hashedPass,
                $data['DienThoai'], // JS gửi key 'DienThoai', map vào cột 'SoDienThoai'
                $vaiTro
            ]);

            if ($result) {
                jsonResponse(true, "Đăng ký thành công");
            } else {
                jsonResponse(false, "Đăng ký thất bại");
            }

        } catch (Exception $e) {
            // Bắt lỗi Duplicate nếu bước kiểm tra trên bị lọt lưới
            if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                 if (strpos($e->getMessage(), 'SoDienThoai')) {
                    jsonResponse(false, "Số điện thoại này đã tồn tại!");
                 } else {
                    jsonResponse(false, "Email hoặc SĐT đã tồn tại!");
                 }
            } else {
                jsonResponse(false, "Lỗi: " . $e->getMessage());
            }
        }
    }

    /** =================================
     * ĐĂNG NHẬP
     * ================================= */
    public function login() {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $email = $data['Email'] ?? '';
        $pass  = $data['MatKhau'] ?? '';

        if (empty($email) || empty($pass)) {
            jsonResponse(false, "Vui lòng nhập Email và Mật khẩu");
            return;
        }

        try {
            $stmt = $this->db->prepare("SELECT * FROM users WHERE Email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Kiểm tra user và mật khẩu
            if ($user && password_verify($pass, $user['MatKhau'])) {
                
                // Kiểm tra trạng thái
                if ($user['TrangThai'] == 0) {
                    jsonResponse(false, "Tài khoản đã bị khóa");
                    return;
                }

                // Xóa thông tin nhạy cảm (Đã bỏ reset_token vì DB đã xóa cột này)
                unset($user['MatKhau']);
                // unset($user['reset_token']); // Dòng này không cần nữa vì cột đã xóa

                jsonResponse(true, "Đăng nhập thành công", $user);
            } else {
                jsonResponse(false, "Email hoặc mật khẩu không chính xác");
            }

        } catch (Exception $e) {
            jsonResponse(false, "Lỗi hệ thống: " . $e->getMessage());
        }
    }
}
?>