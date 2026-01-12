<?php
require_once __DIR__ . "/../core/Model.php";

class DonHangLog extends Model {

    /**
     * GHI LOG THAY ĐỔI TRẠNG THÁI ĐƠN HÀNG
     * (Thay NhanVienID bằng UserID - người thực hiện hành động)
     */
    public function addLog($DonHangID, $UserID = null, $TrangThaiMoi = null, $GhiChu = null)
    {
        // Sửa cột NhanVienID -> UserID
        $sql = "INSERT INTO DonHangLog (DonHangID, UserID, TrangThaiMoi, GhiChu)
                VALUES (:DonHangID, :UserID, :TrangThaiMoi, :GhiChu)";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'DonHangID'    => $DonHangID,
            'UserID'       => $UserID, // UserID của Admin/Nhân viên thao tác
            'TrangThaiMoi' => $TrangThaiMoi,
            'GhiChu'       => $GhiChu
        ]);
    }

    /**
     * LẤY TOÀN BỘ LOG CỦA MỘT ĐƠN
     */
    public function getByDonHang($DonHangID)
    {
        // Sửa JOIN bảng NhanVien -> users
        // Lấy HoTen từ bảng users
        $sql = "SELECT log.*, u.HoTen AS TenNguoiXuLy
                FROM DonHangLog log
                LEFT JOIN users u ON log.UserID = u.UserID
                WHERE log.DonHangID = ?
                ORDER BY log.NgayCapNhat ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$DonHangID]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * LẤY LOG MỚI NHẤT CỦA ĐƠN HÀNG
     */
    public function getLastLog($DonHangID)
    {
        // Sửa JOIN bảng NhanVien -> users
        $sql = "SELECT log.*, u.HoTen AS TenNguoiXuLy
                FROM DonHangLog log
                LEFT JOIN users u ON log.UserID = u.UserID
                WHERE log.DonHangID = ?
                ORDER BY log.LogID ASC
                LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$DonHangID]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>