<?php
require_once __DIR__ . "/../core/Model.php";

class DonHang extends Model {
    
    // Tạo đơn hàng mới
    public function create($data) {
        $sql = "INSERT INTO DonHang 
                (UserID, DiaChiGiao, SoDienThoai, PhuongThucTT, TongTien, TienGiamVoucher, KhuyenMaiID, TrangThai)
                VALUES (:uid, :diachi, :sdt, :pttt, :tong, :giam, :kmid, 'ChoXacNhan')";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':uid'    => $data['UserID'],
            ':diachi' => $data['DiaChiGiao'],
            ':sdt'    => $data['SoDienThoai'],
            ':pttt'   => $data['PhuongThucTT'],
            ':tong'   => $data['TongTien'],
            ':giam'   => $data['TienGiamVoucher'] ?? 0,
            ':kmid'   => $data['KhuyenMaiID'] ?? null
        ]);
        
        return $this->db->lastInsertId();
    }

    // Lấy danh sách đơn hàng của 1 User
    public function getByUser($userId) {
        $sql = "SELECT * FROM DonHang WHERE UserID = ? ORDER BY DonHangID ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Admin lấy tất cả đơn
    public function getAll() {
        // SỬA LẠI: 
        // 1. Dùng LEFT JOIN để đơn hàng vẫn hiện dù user bị xóa
        // 2. Đổi 'AS NguoiDat' thành 'AS HoTen' để khớp với file JS
        $sql = "SELECT d.*, u.HoTen 
                FROM DonHang d 
                LEFT JOIN users u ON d.UserID = u.UserID 
                ORDER BY d.DonHangID ASC";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>