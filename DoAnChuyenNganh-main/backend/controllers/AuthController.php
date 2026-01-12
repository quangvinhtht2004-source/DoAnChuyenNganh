<?php
require_once __DIR__ . "/../config/Database.php";
require_once __DIR__ . "/../models/User.php"; 
require_once __DIR__ . "/../helper/response.php";
require_once __DIR__ . "/../helper/SendMail.php";

class AuthController {
    private $db;
    private $userModel;

    public function __construct() {
        $this->db = (new Database())->connect();
        $this->userModel = new User($this->db);
        
        // Đảm bảo Session luôn được start trong Constructor
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    // --- GỬI OTP ĐĂNG KÝ ---
    public function sendOtp() {
        $data = json_decode(file_get_contents("php://input"), true);
        $email = $data['Email'] ?? '';
        $phone = $data['DienThoai'] ?? '';

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(false, "Email không hợp lệ");
            return;
        }

        // [ĐÃ SỬA] Xóa bớt đoạn code lặp kiểm tra Email thừa ở đây
        if ($this->userModel->checkEmailExists($email)) {
            jsonResponse(false, "Email này đã được đăng ký! Vui lòng dùng email khác.");
            return;
        }

        if ($this->userModel->checkPhoneExists($phone)) {
            jsonResponse(false, "Số điện thoại này đã được đăng ký! Vui lòng dùng số khác.");
            return;
        }

        $otp = rand(100000, 999999);


        $_SESSION['otp_code'] = strval($otp);
        $_SESSION['otp_email'] = $email;
        $_SESSION['otp_time'] = time();
        session_write_close(); 

        $subject = "Mã xác thực đăng ký VKD BookStore";
        $body = "<h2>VKD BookStore</h2><p>Mã OTP của bạn là: <b style='color:red; font-size:20px;'>$otp</b></p><p>Mã có hiệu lực 2 phút.</p>";

        if (SendMail::send($email, $subject, $body)) {
            session_start(); 
            jsonResponse(true, "Mã OTP đã gửi! Kiểm tra email.");
        } else {
            jsonResponse(false, "Lỗi gửi mail.");
        }
    }

    // --- ĐĂNG KÝ ---
    public function register() {
        $data = json_decode(file_get_contents("php://input"), true);
        $userOtp = isset($data['otp']) ? strval($data['otp']) : '';
        $email = $data['Email'] ?? '';

        if (!isset($_SESSION['otp_code'])) {
            jsonResponse(false, "Vui lòng lấy mã OTP trước khi đăng ký.");
            return;
        }

        if ($_SESSION['otp_email'] !== $email) {
            jsonResponse(false, "Email không khớp với mã OTP đã gửi.");
            return;
        }

        if ($userOtp !== $_SESSION['otp_code']) {
            jsonResponse(false, "Mã OTP không chính xác.");
            return;
        }

        if (time() - $_SESSION['otp_time'] > 120) {
            unset($_SESSION['otp_code']);
            jsonResponse(false, "Mã OTP đã hết hạn. Vui lòng lấy lại.");
            return;
        }

        $rawPassword = $data['MatKhau'] ?? '';
        if (strlen($rawPassword) < 6) {
            jsonResponse(false, "Mật khẩu phải đủ 6 ký tự!");
            return;
        }

        // Tạo User
        $this->userModel->HoTen = $data['HoTen'];
        $this->userModel->Email = $data['Email'];
        $this->userModel->SoDienThoai = $data['DienThoai'] ?? '';
        $this->userModel->MatKhau = password_hash($data['MatKhau'], PASSWORD_DEFAULT);
        $this->userModel->VaiTro = 'KhachHang';
        $this->userModel->TrangThai = 1;

        try {
            if ($this->userModel->create()) {
                unset($_SESSION['otp_code']);
                unset($_SESSION['otp_email']);
                unset($_SESSION['otp_time']);
                jsonResponse(true, "Đăng ký thành công!");
            } 
        } catch (Exception $e) {
            $msg = $e->getMessage();
            if (strpos($msg, 'Duplicate entry') !== false) {
                if (strpos($msg, 'Email') !== false) {
                    jsonResponse(false, "Email này đã được đăng ký bởi tài khoản khác!");
                } else if (strpos($msg, 'SoDienThoai') !== false || strpos($msg, 'DienThoai') !== false) {
                    jsonResponse(false, "Số điện thoại này đã được đăng ký!");
                } else {
                    jsonResponse(false, "Thông tin đã tồn tại trong hệ thống.");
                }
            } else {
                jsonResponse(false, "Lỗi hệ thống: " . $msg);
            }
        }
    }

    // --- ĐĂNG NHẬP ---
    public function login() {
        $data = json_decode(file_get_contents("php://input"), true);
        $tk = $data['TaiKhoan'] ?? ($data['Email'] ?? '');
        $mk = $data['MatKhau'] ?? '';

        if (empty($tk) || empty($mk)) {
            jsonResponse(false, "Thiếu thông tin đăng nhập");
            return;
        }

        $stmt = $this->db->prepare("SELECT * FROM users WHERE Email = ? OR HoTen = ?");
        $stmt->execute([$tk, $tk]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($mk, $user['MatKhau'])) {
            if ($user['TrangThai'] == 0) {
                jsonResponse(false, "Tài khoản bị khóa");
                return;
            }
            unset($user['MatKhau']);
            jsonResponse(true, "Đăng nhập thành công", $user);
        } else {
            jsonResponse(false, "Sai tài khoản hoặc mật khẩu");
        }
    }

    // --- QUÊN MẬT KHẨU (Gửi OTP) ---
    public function forgotPassword() {
        $data = json_decode(file_get_contents("php://input"), true);
        $email = $data['Email'] ?? '';

        if (empty($email)) {
            jsonResponse(false, "Vui lòng nhập Email.");
            return;
        }

        if (!$this->userModel->checkEmailExists($email)) {
            jsonResponse(false, "Email này chưa được đăng ký trong hệ thống!");
            return;
        }

        $otp = rand(100000, 999999);

        // Lưu Session Reset
        $_SESSION['reset_otp_code'] = strval($otp);
        $_SESSION['reset_email'] = $email;
        $_SESSION['reset_time'] = time();
        session_write_close(); 

        $subject = "Mã xác thực Đặt lại mật khẩu - VKD BookStore";
        $body = "<h2>VKD BookStore</h2>
                 <p>Bạn đang yêu cầu đặt lại mật khẩu.</p>
                 <p>Mã OTP của bạn là: <b style='color:red; font-size:20px;'>$otp</b></p>
                 <p>Mã có hiệu lực 5 phút.</p>";

        if (SendMail::send($email, $subject, $body)) {
            session_start(); 
            jsonResponse(true, "Mã OTP đã gửi đến email của bạn.");
        } else {
            jsonResponse(false, "Lỗi gửi mail: Không thể gửi OTP.");
        }
    }
    public function verifyOtpReset() {
        $data = json_decode(file_get_contents("php://input"), true);
        $otp = $data['otp'] ?? '';

        // 1. Kiểm tra session
        if (!isset($_SESSION['reset_otp_code'])) {
            jsonResponse(false, "Phiên làm việc hết hạn. Vui lòng gửi lại mã.");
            return;
        }

        // 2. Kiểm tra thời gian (2 phút)
        if (time() - $_SESSION['reset_time'] > 120) {
            unset($_SESSION['reset_otp_code']); 
            jsonResponse(false, "Mã OTP đã hết hạn. Vui lòng lấy lại.");
            return;
        }

        // 3. So sánh OTP
        if ($otp == $_SESSION['reset_otp_code']) {
           
            $_SESSION['otp_verified'] = true; 
            jsonResponse(true, "OTP chính xác! Chuyển hướng...");
        } else {
            jsonResponse(false, "Mã OTP không chính xác.");
        }
    }

    // --- XÁC NHẬN ĐỔI MẬT KHẨU ---
    public function resetPassword() {
       $data = json_decode(file_get_contents("php://input"), true);
        $newPass = $data['MatKhauMoi'] ?? '';
        
        
        if (!isset($_SESSION['otp_verified']) || $_SESSION['otp_verified'] !== true) {
            jsonResponse(false, "Bạn chưa xác thực OTP. Vui lòng làm lại từ đầu.");
            return;
        }

        if (strlen($newPass) < 6) {
            jsonResponse(false, "Mật khẩu phải có ít nhất 6 ký tự.");
            return;
        }


        // 2. Thực hiện đổi pass
        $email = $_SESSION['reset_email'];
        $hashedPass = password_hash($newPass, PASSWORD_DEFAULT);

        if ($this->userModel->updatePasswordByEmail($email, $hashedPass)) {
            session_destroy(); 
            jsonResponse(true, "Đổi mật khẩu thành công!");
        } else {
            jsonResponse(false, "Lỗi hệ thống: Không thể cập nhật mật khẩu.");
        }
    }
}
?>