<?php
require_once __DIR__ . "/../core/Model.php";

class Sach extends Model
{
    /** ================================
     * XỬ LÝ GIÁ (Hàm hỗ trợ)
     * ================================ */
    private function processPrice($book)
    {
        if (!$book) return null;

        $goc = floatval($book["Gia"]);
        $giam = intval($book["PhanTramGiam"]);

        $book["GiaGoc"] = $goc;

        if ($giam > 0) {
            $book["GiaBan"] = ($goc * (100 - $giam)) / 100;
        } else {
            $book["GiaBan"] = $goc;
        }

        return $book;
    }

    private function processList($books)
    {
        foreach ($books as &$b) {
            $b = $this->processPrice($b);
        }
        return $books;
    }

    /** ================================
     * BASE QUERY 
     * ================================ */
    private $baseSelect = "
        SELECT 
            s.*,
            tl.TenTheLoai,
            tg.TenTacGia,
            nxb.TenNhaXuatBan
        FROM Sach s
        LEFT JOIN TheLoai tl ON s.TheLoaiID = tl.TheLoaiID
        LEFT JOIN TacGia tg ON s.TacGiaID = tg.TacGiaID
        LEFT JOIN NhaXuatBan nxb ON s.NhaXuatBanID = nxb.NhaXuatBanID
    ";

    /** ================================
     * [UPDATE] KIỂM TRA TRÙNG TÊN SÁCH
     * Hỗ trợ loại trừ ID khi đang Cập nhật
     * ================================ */
    public function checkName($tenSach, $excludeID = null)
    {
        $sql = "SELECT COUNT(*) as count FROM Sach WHERE TenSach = ?";
        $params = [trim($tenSach)];

        if ($excludeID) {
            $sql .= " AND SachID != ?";
            $params[] = $excludeID;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $row['count'] > 0;
    }

    /** ================================
     * 1. LẤY TẤT CẢ CHO ADMIN
     * ================================ */
    public function getAllAdmin() {
        $sql = $this->baseSelect . " ORDER BY s.SachID ASC"; // Sửa thành DESC để sách mới lên đầu
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $this->processList($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /** ================================
     * 2. LẤY CHI TIẾT SÁCH
     * ================================ */
    public function getById($id)
    {
        $sql = $this->baseSelect . " WHERE s.SachID = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);

        return $this->processPrice($stmt->fetch(PDO::FETCH_ASSOC));
    }

    /** ================================
     * [MỚI] 3. THÊM SÁCH MỚI
     * ================================ */
    public function create($data)
    {
        $sql = "INSERT INTO Sach (TenSach, TacGiaID, TheLoaiID, NhaXuatBanID, Gia, PhanTramGiam, SoLuong, MoTa, AnhBia, TrangThai, NgayTao) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            trim($data['TenSach']),
            $data['TacGiaID'],
            $data['TheLoaiID'],
            $data['NhaXuatBanID'],
            $data['Gia'],
            $data['PhanTramGiam'] ?? 0,
            $data['SoLuong'] ?? 0,
            $data['MoTa'] ?? '',
            $data['AnhBia'] ?? null,
            $data['TrangThai'] ?? 1
        ]);
    }

    /** ================================
     * [MỚI] 4. CẬP NHẬT SÁCH
     * ================================ */
    public function update($data)
    {
        $sql = "UPDATE Sach SET 
                TenSach = ?, 
                TacGiaID = ?, 
                TheLoaiID = ?, 
                NhaXuatBanID = ?, 
                Gia = ?, 
                PhanTramGiam = ?, 
                SoLuong = ?, 
                MoTa = ?, 
                AnhBia = ?, 
                TrangThai = ?
                WHERE SachID = ?";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            trim($data['TenSach']),
            $data['TacGiaID'],
            $data['TheLoaiID'],
            $data['NhaXuatBanID'],
            $data['Gia'],
            $data['PhanTramGiam'],
            $data['SoLuong'],
            $data['MoTa'],
            $data['AnhBia'],
            $data['TrangThai'],
            $data['SachID']
        ]);
    }

    /** ================================
     * [MỚI] 5. XÓA SÁCH
     * ================================ */
    public function delete($id)
    {
        $stmt = $this->db->prepare("DELETE FROM Sach WHERE SachID = ?");
        return $stmt->execute([$id]);
    }

    /** ================================
     * 6. TÌM KIẾM SÁCH (PUBLIC)
     * ================================ */
    public function search($keyword)
    {
        $sql = $this->baseSelect . "
                WHERE s.TrangThai = 1
                AND (
                    s.TenSach LIKE ? 
                    OR tg.TenTacGia LIKE ? 
                    OR tl.TenTheLoai LIKE ? 
                    OR nxb.TenNhaXuatBan LIKE ?
                )
                ORDER BY s.SachID ASC";

        $kw = "%$keyword%";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$kw, $kw, $kw, $kw]);

        return $this->processList($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /** ================================
     * 7. SÁCH MỚI VỀ
     * ================================ */
    public function getNewArrivals()
    {
        $sql = $this->baseSelect . "
                WHERE s.TrangThai = 1
                ORDER BY s.SachID DESC
                LIMIT 10";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        return $this->processList($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /** ================================
     * 8. SÁCH BÁN CHẠY
     * ================================ */
    public function getBestSellers()
    {
        $sql = $this->baseSelect . "
                WHERE s.TrangThai = 1
                ORDER BY s.SoDanhGia DESC, s.RatingTB DESC
                LIMIT 8";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        return $this->processList($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /** ================================
     * 9. LẤY THEO THỂ LOẠI
     * ================================ */
    public function getByTheLoai($listIds)
    {
        $arrIds = explode(',', $listIds);
        $cleanIds = [];
        foreach($arrIds as $id) {
            if(intval($id) > 0) $cleanIds[] = intval($id);
        }

        if(empty($cleanIds)) return [];

        $idString = implode(',', $cleanIds);

        $sql = $this->baseSelect . " 
                WHERE s.TrangThai = 1 
                AND s.TheLoaiID IN ($idString) 
                ORDER BY s.SachID ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        return $this->processList($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /** ================================
     * 10. CẬP NHẬT RATING & TỒN KHO
     * ================================ */
    public function updateRating($SachID, $SoSao)
    {
        $sql = "UPDATE Sach 
                SET RatingTB = ((RatingTB * SoDanhGia) + :SoSao) / (SoDanhGia + 1),
                    SoDanhGia = SoDanhGia + 1
                WHERE SachID = :SachID";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([":SoSao" => $SoSao, ":SachID" => $SachID]);
    }

    public function checkStock($SachID)
    {
        $stmt = $this->db->prepare("SELECT SoLuong FROM Sach WHERE SachID = ?");
        $stmt->execute([$SachID]);
        return intval($stmt->fetchColumn());
    }

    public function updateStock($SachID, $SoLuongMua)
    {
        $sql = "UPDATE Sach SET SoLuong = SoLuong - :sl WHERE SachID = :id AND SoLuong >= :sl";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([":sl" => $SoLuongMua, ":id" => $SachID]);
    }
}
?>