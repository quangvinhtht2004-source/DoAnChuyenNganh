<?php
require_once __DIR__ . "/../core/Model.php";

class NhaXuatBan extends Model
{
    // Lấy danh sách (Sắp xếp ID tăng dần từ bé đến lớn)
    public function getAll()
    {
        $stmt = $this->db->prepare("SELECT * FROM NhaXuatBan ORDER BY NhaXuatBanID ASC");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // --- HÀM MỚI: KIỂM TRA TỒN TẠI ---
    public function checkExist($ten)
    {
        // Kiểm tra chính xác tên NXB
        $sql = "SELECT NhaXuatBanID, TenNhaXuatBan FROM NhaXuatBan WHERE TenNhaXuatBan = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([trim($ten)]); 
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    // ---------------------------------

    public function create($ten)
    {
        if (trim($ten) == "") return false;
        try {
            $stmt = $this->db->prepare("INSERT INTO NhaXuatBan (TenNhaXuatBan) VALUES (?)");
            return $stmt->execute([trim($ten)]);
        } catch (PDOException $e) {
            return false;
        }
    }

    public function update($id, $ten)
    {
        if (trim($ten) == "") return false;
        try {
            $stmt = $this->db->prepare("UPDATE NhaXuatBan SET TenNhaXuatBan = ? WHERE NhaXuatBanID = ?");
            return $stmt->execute([trim($ten), $id]);
        } catch (PDOException $e) {
            return false;
        }
    }

    public function delete($id)
    {
        try {
            // Set NULL cho sách thuộc NXB này để tránh lỗi khóa ngoại
            $this->db->prepare("UPDATE Sach SET NhaXuatBanID = NULL WHERE NhaXuatBanID = ?")
                     ->execute([$id]);

            $stmt = $this->db->prepare("DELETE FROM NhaXuatBan WHERE NhaXuatBanID = ?");
            return $stmt->execute([$id]);
        } catch (Exception $e) {
            return false;
        }
    }
}
?>