<?php
require_once __DIR__ . "/../core/Model.php";

class Sach extends Model
{
    /** ================================
     * XỬ LÝ PRICE
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
     * BASE QUERY JOIN
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
     * 1. LẤY CHI TIẾT SÁCH
     * ================================ */
    public function getById($id)
    {
        $sql = $this->baseSelect . " WHERE s.SachID = ? AND s.TrangThai = 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);

        return $this->processPrice($stmt->fetch(PDO::FETCH_ASSOC));
    }

    /** ================================
     * 2. TÌM KIẾM SÁCH (SẮP XẾP THEO ID TĂNG DẦN)
     * ================================ */
    public function search($keyword)
    {
        $sql = $this->baseSelect . "
                WHERE s.TrangThai = 1
                AND (s.TenSach LIKE ? OR tg.TenTacGia LIKE ?)
                ORDER BY s.SachID ASC";

        $kw = "%$keyword%";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$kw, $kw]);

        return $this->processList($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /** ================================
     * 3. SÁCH MỚI VỀ
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
     * 4. SÁCH BÁN CHẠY
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

   public function getByTheLoai($listIds)
{
    // 1. Xử lý bảo mật: Chỉ giữ lại các con số, loại bỏ ký tự lạ để tránh SQL Injection
    // Ví dụ input: "1, 3, a, '" -> Output mảng: [1, 3]
    $arrIds = explode(',', $listIds);
    $cleanIds = [];
    foreach($arrIds as $id) {
        if(intval($id) > 0) {
            $cleanIds[] = intval($id);
        }
    }

    if(empty($cleanIds)) return [];

    // 2. Chuyển lại thành chuỗi để đưa vào SQL
    $idString = implode(',', $cleanIds);

    // 3. Sắp xếp theo ID tăng dần (#1 -> #102)
    $sql = $this->baseSelect . " 
            WHERE s.TrangThai = 1 
            AND s.TheLoaiID IN ($idString) 
            ORDER BY s.SachID ASC";

    $stmt = $this->db->prepare($sql);
    $stmt->execute();

    return $this->processList($stmt->fetchAll(PDO::FETCH_ASSOC));
}

    /** ================================
     * 5. CẬP NHẬT RATING
     * ================================ */
    public function updateRating($SachID, $SoSao)
    {
        $sql = "UPDATE Sach 
                SET RatingTB = ((RatingTB * SoDanhGia) + :SoSao) / (SoDanhGia + 1),
                    SoDanhGia = SoDanhGia + 1
                WHERE SachID = :SachID";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([
            ":SoSao" => $SoSao,
            ":SachID" => $SachID
        ]);
    }

    /** ================================
     * 6. KIỂM TRA TỒN KHO
     * ================================ */
    public function checkStock($SachID)
    {
        $stmt = $this->db->prepare("SELECT SoLuong FROM Sach WHERE SachID = ?");
        $stmt->execute([$SachID]);
        return intval($stmt->fetchColumn());
    }

    /** ================================
     * 7. CẬP NHẬT TỒN KHO (TRỪ HÀNG)
     * ================================ */
    public function updateStock($SachID, $SoLuongMua)
    {
        $sql = "UPDATE Sach 
                SET SoLuong = SoLuong - :sl 
                WHERE SachID = :id AND SoLuong >= :sl";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([
            ":sl" => $SoLuongMua,
            ":id" => $SachID
        ]);
    }
}
?>