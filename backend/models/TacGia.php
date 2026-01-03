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

    public function create($ten)
    {
        if (trim($ten) == "") return false;

        $stmt = $this->db->prepare("INSERT INTO TacGia (TenTacGia) VALUES (?)");
        return $stmt->execute([$ten]);
    }

    public function update($id, $ten)
    {
        if (trim($ten) == "") return false;

        $stmt = $this->db->prepare("UPDATE TacGia SET TenTacGia = ? WHERE TacGiaID = ?");
        return $stmt->execute([$ten, $id]);
    }

    public function delete($id)
    {
        $this->db->prepare("UPDATE Sach SET TacGiaID = NULL WHERE TacGiaID = ?")
                 ->execute([$id]);

        $stmt = $this->db->prepare("DELETE FROM TacGia WHERE TacGiaID = ?");
        return $stmt->execute([$id]);
    }
}
?>
