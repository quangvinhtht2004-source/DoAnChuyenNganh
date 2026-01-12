<?php
require_once __DIR__ . "/../core/Model.php";

class TheLoai extends Model
{
    /**
     * LẤY TẤT CẢ THỂ LOẠI (Sắp xếp theo ID tăng dần)
     */
    public function getAll()
    {
        $stmt = $this->db->prepare("SELECT * FROM TheLoai ORDER BY TheLoaiID ASC");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * LẤY THỂ LOẠI THEO ID
     */
    public function getById($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM TheLoai WHERE TheLoaiID = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * KIỂM TRA TRÙNG TÊN
     */
    public function exists($ten)
    {
        $stmt = $this->db->prepare("SELECT 1 FROM TheLoai WHERE TenTheLoai = ?");
        $stmt->execute([$ten]);
        return $stmt->fetch() ? true : false;
    }

    /**
     * THÊM THỂ LOẠI
     */
    public function create($ten)
    {
        if (trim($ten) == "") return ["status" => false, "message" => "Tên thể loại không được để trống"];

        if ($this->exists($ten)) {
            return ["status" => false, "message" => "Thể loại đã tồn tại"];
        }

        $stmt = $this->db->prepare("INSERT INTO TheLoai (TenTheLoai) VALUES (?)");
        $stmt->execute([$ten]);

        return ["status" => true, "message" => "Thêm thể loại thành công"];
    }

    /**
     * SỬA TÊN THỂ LOẠI
     */
    public function update($id, $ten)
    {
        if (trim($ten) == "") return ["status" => false, "message" => "Tên thể loại không được để trống"];

        // Kiểm tra tên trùng (ngoại trừ ID hiện tại)
        $stmt = $this->db->prepare("SELECT 1 FROM TheLoai WHERE TenTheLoai = ? AND TheLoaiID != ?");
        $stmt->execute([$ten, $id]);

        if ($stmt->fetch()) {
            return ["status" => false, "message" => "Tên thể loại đã tồn tại"];
        }

        $stmt = $this->db->prepare("UPDATE TheLoai SET TenTheLoai = ? WHERE TheLoaiID = ?");
        $stmt->execute([$ten, $id]);

        return ["status" => true, "message" => "Cập nhật thể loại thành công"];
    }

    /**
     * XOÁ THỂ LOẠI
     * — Để tránh lỗi FK, set NULL cho sách trước
     */
    public function delete($id)
    {
        // Set NULL ở bảng Sach theo FK rule
        $this->db->prepare("UPDATE Sach SET TheLoaiID = NULL WHERE TheLoaiID = ?")
                 ->execute([$id]);

        $stmt = $this->db->prepare("DELETE FROM TheLoai WHERE TheLoaiID = ?");
        $stmt->execute([$id]);

        return true;
    }
}
?>