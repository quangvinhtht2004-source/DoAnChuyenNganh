<?php
require_once __DIR__ . "/../core/Model.php";

class GioHang extends Model {

    /**
     * LẤY GIỎ HÀNG — NẾU CHƯA CÓ THÌ TỰ TẠO
     */
    public function getOrCreate($UserID)
    {
        // 1. Tìm giỏ hàng theo UserID
        $stmt = $this->db->prepare("SELECT * FROM GioHang WHERE UserID = ? LIMIT 1");
        $stmt->execute([$UserID]);
        $cart = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($cart) return $cart;

        // 2. Chưa có thì tạo giỏ mới
        $stmt = $this->db->prepare("INSERT INTO GioHang (UserID) VALUES (?)");
        $stmt->execute([$UserID]);

        return [
            "GioHangID" => $this->db->lastInsertId(),
            "UserID"    => $UserID
        ];
    }

    public function clearCart($GioHangID)
    {
        $stmt = $this->db->prepare("DELETE FROM GioHangItem WHERE GioHangID = ?");
        return $stmt->execute([$GioHangID]);
    }
}
?>