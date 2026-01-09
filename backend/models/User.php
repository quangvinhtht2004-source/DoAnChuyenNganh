<?php
// backend/models/User.php

require_once __DIR__ . "/../core/Model.php";

class User extends Model
{
    // Các thuộc tính public để AuthController có thể gán dữ liệu trực tiếp
    public $HoTen;
    public $Email;
    public $MatKhau;
    public $SoDienThoai; // Lưu ý: Database của bạn có thể là 'DienThoai' hoặc 'SoDienThoai', hãy kiểm tra kỹ
    public $DiaChi;
    public $VaiTro;
    public $TrangThai;

    public function checkEmailExists($email)
    {
        $stmt = $this->db->prepare("SELECT UserID FROM users WHERE Email = ? LIMIT 1");
        $stmt->execute([$email]);
        return $stmt->rowCount() > 0;
    }
    public function checkPhoneExists($phone)
    {
        $stmt = $this->db->prepare("SELECT UserID FROM users WHERE SoDienThoai = ? LIMIT 1");
        $stmt->execute([$phone]);
        return $stmt->rowCount() > 0;
    }

    /** ====================================
     * [QUAN TRỌNG] HÀM TẠO USER (Khớp với AuthController)
     * ==================================== */
    public function create()
{

        $sql = "INSERT INTO users (HoTen, Email, MatKhau, SoDienThoai, VaiTro, TrangThai)
                VALUES (:HoTen, :Email, :MatKhau, :SoDienThoai, :VaiTro, :TrangThai)";

        $stmt = $this->db->prepare($sql);
        
        return $stmt->execute([
            ":HoTen"       => $this->HoTen,
            ":Email"       => $this->Email,
            ":MatKhau"     => $this->MatKhau, 
            ":SoDienThoai" => $this->SoDienThoai,
            ":VaiTro"      => $this->VaiTro,
            ":TrangThai"   => $this->TrangThai
        ]);

}

    /** ====================================
     * LẤY TẤT CẢ USER
     * ==================================== */
    public function getAll()
    {
        $stmt = $this->db->prepare("
            SELECT UserID, HoTen, Email, SoDienThoai, DiaChi, VaiTro, TrangThai, NgayTao
            FROM users 
            ORDER BY UserID ASC
        ");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /** ====================================
     * ĐĂNG NHẬP (Giữ nguyên logic của bạn)
     * ==================================== */
    public function login($email, $password)
    {
        // 1. Tìm user
        $stmt = $this->db->prepare("SELECT * FROM users WHERE Email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // 2. Kiểm tra tồn tại
        if (!$user) {
            return ["status" => false, "message" => "Email hoặc mật khẩu không đúng"];
        }

        // 3. Kiểm tra trạng thái
        if ($user["TrangThai"] == 0) {
            return ["status" => false, "message" => "Tài khoản đã bị khóa"];
        }

        // 4. Kiểm tra mật khẩu
        // Vì AuthController dùng password_hash, nên đăng nhập cũng phải dùng password_verify
        // Nếu bạn muốn dùng pass thường, hãy sửa lại dòng này thành: if ($password !== $user["MatKhau"])
        if (!password_verify($password, $user["MatKhau"])) {
             return ["status" => false, "message" => "Email hoặc mật khẩu không đúng"];
        }

        // 5. Thành công
        unset($user["MatKhau"]);
        return ["status" => true, "data" => $user];
    }
    public function updatePasswordByEmail($email, $newHashPass) {
        try {
            $sql = "UPDATE users SET MatKhau = ? WHERE Email = ?";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([$newHashPass, $email]);
        } catch (Exception $e) {
            return false;
        }
    }
}

?>