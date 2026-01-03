<?php
require_once __DIR__ . "/../core/Model.php";

class User extends Model
{
    /** ====================================
     * LẤY TẤT CẢ USER (Sắp xếp theo ID tăng dần)
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
     * ĐĂNG NHẬP (So sánh trực tiếp, không mã hóa)
     * ==================================== */
    public function login($email, $password)
    {
        // 1. Tìm user theo email
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

        // 4. SO SÁNH MẬT KHẨU (DẠNG THÔ)
        // Lưu ý: So sánh chính xác từng ký tự (===)
        if ($password !== $user["MatKhau"]) {
            return ["status" => false, "message" => "Email hoặc mật khẩu không đúng"];
        }

        // 5. Thành công (Xóa mật khẩu trong kết quả trả về để bảo mật)
        unset($user["MatKhau"]);
        unset($user["reset_token"]);

        return ["status" => true, "data" => $user];
    }

    /** ====================================
     * ĐĂNG KÝ (Lưu trực tiếp, không mã hóa)
     * ==================================== */
    public function register($data)
    {
        try {
            if ($this->emailExists($data['Email'])) {
                return ["status" => false, "message" => "Email này đã được sử dụng!"];
            }

            // BỎ MÃ HÓA: Lưu thẳng mật khẩu người dùng nhập
            $plainPass = $data["MatKhau"]; 

            $sql = "INSERT INTO users (HoTen, Email, MatKhau, DienThoai, DiaChi, VaiTro, TrangThai)
                    VALUES (:HoTen, :Email, :MatKhau, :DienThoai, :DiaChi, 'KhachHang', 1)";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ":HoTen"     => $data["HoTen"],
                ":Email"     => $data["Email"],
                ":MatKhau"   => $plainPass, // Lưu pass thô
                ":DienThoai" => $data["DienThoai"] ?? null,
                ":DiaChi"    => $data["DiaChi"] ?? null
            ]);

            return ["status" => true, "message" => "Đăng ký thành công!"];

        } catch (PDOException $e) {
            return ["status" => false, "message" => "Lỗi: " . $e->getMessage()];
        }
    }

    /** ====================================
     * TẠO USER NỘI BỘ (Admin tạo nhân viên)
     * ==================================== */
    public function createInternal($data)
    {
        if ($this->emailExists($data['Email'])) {
            return ["status" => false, "message" => "Email đã tồn tại"];
        }

        // BỎ MÃ HÓA
        $plainPass = $data["MatKhau"];
        
        $sql = "INSERT INTO users (HoTen, Email, MatKhau, VaiTro, TrangThai) 
                VALUES (?, ?, ?, ?, 1)";
        
        $ok = $this->db->prepare($sql)->execute([
            $data["HoTen"], 
            $data["Email"], 
            $plainPass, // Lưu pass thô
            $data["VaiTro"]
        ]);

        return $ok 
            ? ["status" => true, "message" => "Tạo tài khoản thành công"]
            : ["status" => false, "message" => "Lỗi hệ thống"];
    }

    // Helper: Check email
    public function emailExists($email) {
        $stmt = $this->db->prepare("SELECT 1 FROM users WHERE Email = ?");
        $stmt->execute([$email]);
        return $stmt->fetchColumn();
    }
    
    // Helper: Lấy User theo ID
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT UserID, HoTen, Email, SoDienThoai, DiaChi, VaiTro FROM users WHERE UserID = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>