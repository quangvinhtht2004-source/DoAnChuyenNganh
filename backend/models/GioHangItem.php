<?php
require_once __DIR__ . "/../core/Model.php";

class GioHangItem extends Model 
{
    /**
     * ⭐ THÊM SẢN PHẨM VÀO GIỎ
     * — Nếu đã có thì tăng số lượng
     */
    public function addItem($GioHangID, $SachID, $SoLuong) 
    {
        // 1. Kiểm tra tồn kho
        $stmtStock = $this->db->prepare("SELECT SoLuong FROM Sach WHERE SachID = ?");
        $stmtStock->execute([$SachID]);
        $stock = intval($stmtStock->fetchColumn());

        if ($stock <= 0) return false;
        if ($stock < $SoLuong) return false;

        // 2. Kiểm tra sản phẩm đã có trong giỏ chưa
        $stmtCheck = $this->db->prepare(
            "SELECT ItemID, SoLuong FROM GioHangItem WHERE GioHangID = ? AND SachID = ?"
        );
        $stmtCheck->execute([$GioHangID, $SachID]);
        $item = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if ($item) {
            $newQty = min($item["SoLuong"] + $SoLuong, $stock);

            $stmtUpdate = $this->db->prepare(
                "UPDATE GioHangItem SET SoLuong = ? WHERE ItemID = ?"
            );
            return $stmtUpdate->execute([$newQty, $item["ItemID"]]);
        }

        // 3. Thêm item mới
        $stmtInsert = $this->db->prepare(
            "INSERT INTO GioHangItem (GioHangID, SachID, SoLuong) VALUES (?, ?, ?)"
        );
        return $stmtInsert->execute([$GioHangID, $SachID, $SoLuong]);
    }

    /**
     * ⭐ CẬP NHẬT SỐ LƯỢNG CHO NÚT + / -
     */
    public function updateQuantity($ItemID, $SoLuong) 
    {
        if ($SoLuong < 1) $SoLuong = 1;

        $stmt = $this->db->prepare(
            "UPDATE GioHangItem SET SoLuong = ? WHERE ItemID = ?"
        );
        return $stmt->execute([$SoLuong, $ItemID]);
    }

    /**
     * ⭐ LẤY DANH SÁCH SẢN PHẨM TRONG GIỎ (tính giá bán đầy đủ)
     */
    public function getItems($GioHangID) 
    {
        $sql = "
            SELECT 
                ghi.*,
                s.TenSach,
                s.Gia AS GiaGoc,
                s.PhanTramGiam,
                s.AnhBia,
                tg.TenTacGia,
                nxb.TenNhaXuatBan
            FROM GioHangItem ghi
            JOIN Sach s ON ghi.SachID = s.SachID
            LEFT JOIN TacGia tg ON s.TacGiaID = tg.TacGiaID
            LEFT JOIN NhaXuatBan nxb ON s.NhaXuatBanID = nxb.NhaXuatBanID
            WHERE ghi.GioHangID = ?
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$GioHangID]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($items as &$item) {
            $goc = floatval($item["GiaGoc"]);
            $giam = intval($item["PhanTramGiam"]);

            $item["GiaBan"] = ($giam > 0)
                ? round($goc * (100 - $giam) / 100)
                : round($goc);
        }

        return $items;
    }

    /**
     * ⭐ XOÁ SẢN PHẨM KHỎI GIỎ
     */
    public function removeItem($ItemID) 
    {
        $stmt = $this->db->prepare("DELETE FROM GioHangItem WHERE ItemID = ?");
        return $stmt->execute([$ItemID]);
    }
}
?>
