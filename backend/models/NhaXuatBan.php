<?php
require_once __DIR__ . "/../core/Model.php";

class NhaXuatBan extends Model
{
    public function getAll()
    {
        $stmt = $this->db->prepare("SELECT * FROM NhaXuatBan ORDER BY NhaXuatBanID ASC");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($ten)
    {
        if (trim($ten) == "") {
            return ["status" => false, "message" => "Tên NXB không được để trống"];
        }

        $stmt = $this->db->prepare("INSERT INTO NhaXuatBan (TenNhaXuatBan) VALUES (?)");
        $stmt->execute([$ten]);

        return ["status" => true, "message" => "Thêm NXB thành công"];
    }

    public function update($id, $ten)
    {
        if (trim($ten) == "") {
            return ["status" => false, "message" => "Tên NXB không được để trống"];
        }

        $stmt = $this->db->prepare("UPDATE NhaXuatBan SET TenNhaXuatBan = ? WHERE NhaXuatBanID = ?");
        $stmt->execute([$ten, $id]);

        return ["status" => true, "message" => "Cập nhật NXB thành công"];
    }

    public function delete($id)
    {
        // Nếu có sách thuộc NXB này → set NULL để tránh lỗi FK
        $this->db->prepare("UPDATE Sach SET NhaXuatBanID = NULL WHERE NhaXuatBanID = ?")
                 ->execute([$id]);

        $stmt = $this->db->prepare("DELETE FROM NhaXuatBan WHERE NhaXuatBanID = ?");
        $stmt->execute([$id]);

        return true;
    }
}
?>
