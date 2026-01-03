<?php
require_once __DIR__ . "/../core/Model.php";

class Review extends Model
{
    /**
     * THÊM ĐÁNH GIÁ
     */
    public function create($data)
    {
        // Lưu ý: data phải có key 'UserID' thay vì 'KhachHangID'
        $sql = "INSERT INTO Review (UserID, SachID, SoSao, BinhLuan, TrangThai)
                VALUES (?, ?, ?, ?, 1)";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            $data["UserID"],
            $data["SachID"],
            $data["SoSao"],
            $data["BinhLuan"] ?? ""
        ]);
    }

    /**
     * KIỂM TRA ĐÃ ĐÁNH GIÁ CHƯA
     */
    public function checkReviewed($UserID, $SachID)
    {
        $sql = "SELECT ReviewID FROM Review
                WHERE UserID = ? AND SachID = ? AND TrangThai = 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$UserID, $SachID]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * LẤY DANH SÁCH REVIEW (JOIN VỚI BẢNG USERS)
     */
    public function getBySach($SachID)
    {
        // Sửa: JOIN users u ON r.UserID = u.UserID
        $sql = "SELECT r.*, u.HoTen 
                FROM Review r
                JOIN users u ON r.UserID = u.UserID
                WHERE r.SachID = ? AND r.TrangThai = 1
                ORDER BY r.NgayDanhGia DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$SachID]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Các hàm khác giữ nguyên...
    public function getRatingSummary($SachID)
    {
        $sql = "SELECT COUNT(*) AS TongDanhGia, AVG(SoSao) AS DiemTB
                FROM Review WHERE SachID = ? AND TrangThai = 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$SachID]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>