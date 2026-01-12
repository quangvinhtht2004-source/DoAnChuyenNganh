<?php
require_once __DIR__ . "/../core/Model.php";

class KhuyenMai extends Model
{
    /** * Lấy tất cả khuyến mãi 
     * Sắp xếp: Mã đang hoạt động (1) lên trước, sau đó đến mã mới nhất
     */
    public function getAll()
    {
        $stmt = $this->db->prepare("SELECT * FROM KhuyenMai ORDER BY TrangThai ASC, KhuyenMaiID ASC");
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

    /** Tạo mới */
    public function create($data)
    {
        $stmt = $this->db->prepare("
            INSERT INTO KhuyenMai (Code, LoaiKM, GiaTri, DonToiThieu, SoLuong, NgayKetThuc, TrangThai)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        return $stmt->execute([
            strtoupper($data["Code"]),
            $data["LoaiKM"], // 'tien' hoặc 'phantram'
            $data["GiaTri"],
            $data["DonToiThieu"] ?? 0,
            $data["SoLuong"] ?? 0,
            $data["NgayKetThuc"] ?? null,
            isset($data["TrangThai"]) ? intval($data["TrangThai"]) : 1
        ]);
    }

    /** Cập nhật */
    public function update($data)
    {
        $stmt = $this->db->prepare("
            UPDATE KhuyenMai SET
                Code = ?,
                LoaiKM = ?,
                GiaTri = ?,
                DonToiThieu = ?,
                SoLuong = ?,
                NgayKetThuc = ?,
                TrangThai = ?
            WHERE KhuyenMaiID = ?
        ");

        return $stmt->execute([
            strtoupper($data["Code"]),
            $data["LoaiKM"],
            $data["GiaTri"],
            $data["DonToiThieu"] ?? 0,
            $data["SoLuong"] ?? 0,
            $data["NgayKetThuc"] ?? null,
            isset($data["TrangThai"]) ? intval($data["TrangThai"]) : 1,
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

    /** * [MỚI] Hoàn trả số lượng khi hủy đơn 
     */
    public function restoreQuantity($id)
    {
        $stmt = $this->db->prepare("
            UPDATE KhuyenMai 
            SET SoLuong = SoLuong + 1 
            WHERE KhuyenMaiID = ?
        ");
        return $stmt->execute([$id]);
    }
}
?>