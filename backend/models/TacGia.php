<?php
require_once __DIR__ . "/../core/Model.php";

class TacGia extends Model
{
   public function getAll()
    {
      
        $stmt = $this->db->prepare("SELECT * FROM TacGia ORDER BY TacGiaID ASC");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function checkExist($ten)
    {
        // Kiểm tra chính xác tên (MySQL thường không phân biệt hoa thường ở đây nếu collation là ci)
        $sql = "SELECT TacGiaID, TenTacGia FROM TacGia WHERE TenTacGia = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([trim($ten)]); 
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($ten)
    {
        if (trim($ten) == "") return false;
        try {
            $stmt = $this->db->prepare("INSERT INTO TacGia (TenTacGia) VALUES (?)");
            return $stmt->execute([trim($ten)]);
        } catch (PDOException $e) {
            // Bắt lỗi Duplicate entry từ MySQL (nếu Controller check sót)
            return false; 
        }
    }

    public function update($id, $ten)
    {
        if (trim($ten) == "") return false;
        try {
            $stmt = $this->db->prepare("UPDATE TacGia SET TenTacGia = ? WHERE TacGiaID = ?");
            return $stmt->execute([trim($ten), $id]);
        } catch (PDOException $e) {
            return false;
        }
    }

    public function delete($id)
    {
        try {
            $this->db->beginTransaction();
            // Set NULL cho các sách của tác giả này trước
            $stmt1 = $this->db->prepare("UPDATE Sach SET TacGiaID = NULL WHERE TacGiaID = ?");
            $stmt1->execute([$id]);
            
            // Sau đó xóa tác giả
            $stmt2 = $this->db->prepare("DELETE FROM TacGia WHERE TacGiaID = ?");
            $res = $stmt2->execute([$id]);
            
            $this->db->commit();
            return $res;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
}
?>