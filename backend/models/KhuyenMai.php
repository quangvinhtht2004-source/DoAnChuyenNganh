<?php
require_once __DIR__ . "/../core/Model.php";

class KhuyenMai extends Model
{
    /** Lấy tất cả khuyến mãi */
    public function getAll()
    {
        // Sắp xếp theo ID giảm dần (Mới nhất lên đầu)
        $stmt = $this->db->prepare("SELECT * FROM KhuyenMai ORDER BY KhuyenMaiID ASC");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /** Lấy 1 khuyến mãi theo ID */
    public function getById($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM KhuyenMai WHERE KhuyenMaiID = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /** Lấy khuyến mãi theo CODE */
    public function getByCode($code)
    {
        $stmt = $this->db->prepare("SELECT * FROM KhuyenMai WHERE Code = ?");
        $stmt->execute([$code]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /** Tạo mới (Đã rút gọn các cột thừa) */
    public function create($data)
    {
        $stmt = $this->db->prepare("
            INSERT INTO KhuyenMai (Code, LoaiKM, GiaTri, DonToiThieu, SoLuong, NgayKetThuc)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        return $stmt->execute([
            strtoupper($data["Code"]),
            $data["LoaiKM"], // 'tien' hoặc 'phantram'
            $data["GiaTri"],
            $data["DonToiThieu"] ?? 0,
            $data["SoLuong"] ?? 0,
            $data["NgayKetThuc"] ?? null // Nếu null thì hiểu là vĩnh viễn
        ]);
    }

    /** Cập nhật (Đã rút gọn) */
    public function update($data)
    {
        $stmt = $this->db->prepare("
            UPDATE KhuyenMai SET
                Code = ?,
                LoaiKM = ?,
                GiaTri = ?,
                DonToiThieu = ?,
                SoLuong = ?,
                NgayKetThuc = ?
            WHERE KhuyenMaiID = ?
        ");

        return $stmt->execute([
            strtoupper($data["Code"]),
            $data["LoaiKM"],
            $data["GiaTri"],
            $data["DonToiThieu"] ?? 0,
            $data["SoLuong"] ?? 0,
            $data["NgayKetThuc"] ?? null,
            $data["KhuyenMaiID"]
        ]);
    }

    /** Xóa KM */
    public function delete($id)
    {
        $stmt = $this->db->prepare("DELETE FROM KhuyenMai WHERE KhuyenMaiID = ?");
        return $stmt->execute([$id]);
    }

    /** Giảm số lượng khi sử dụng thành công */
    public function decreaseQuantity($id)
    {
        $stmt = $this->db->prepare("
            UPDATE KhuyenMai 
            SET SoLuong = SoLuong - 1 
            WHERE KhuyenMaiID = ? AND SoLuong > 0
        ");
        return $stmt->execute([$id]);
    }
}
?>