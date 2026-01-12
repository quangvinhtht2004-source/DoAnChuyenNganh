<?php
require_once __DIR__ . "/../core/Model.php";

class ChiTietDonHang extends Model {

    /**
     * Thêm 1 dòng chi tiết đơn hàng
     */
    public function add($DonHangID, $SachID, $SoLuong, $DonGia) 
    {
        $sql = "INSERT INTO ChiTietDonHang (DonHangID, SachID, SoLuong, DonGia) 
                VALUES (?, ?, ?, ?)";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$DonHangID, $SachID, $SoLuong, $DonGia]);
    }

    /**
     * Lấy danh sách chi tiết của 1 đơn hàng
     * Có JOIN sách để lấy tên + ảnh
     */
    public function getByDonHang($DonHangID) 
    {
        $sql = "SELECT ct.*, 
                       s.TenSach, 
                       s.AnhBia, 
                       s.Gia AS GiaGoc,
                       s.PhanTramGiam
                FROM ChiTietDonHang ct
                LEFT JOIN Sach s ON ct.SachID = s.SachID
                WHERE ct.DonHangID = ?";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$DonHangID]);

        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Tính giá bán thực tế (nếu có giảm giá)
        foreach ($items as &$item) 
        {
            if ($item["PhanTramGiam"] > 0) {
                $item["GiaBan"] = $item["GiaGoc"] * (100 - $item["PhanTramGiam"]) / 100;
            } else {
                $item["GiaBan"] = $item["GiaGoc"];
            }
        }

        return $items;
    }
}
?>
