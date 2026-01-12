<?php
require_once __DIR__ . "/../config/Database.php";
require_once __DIR__ . "/../helper/response.php";

class ReviewController {
    private $db;

    public function __construct() {
        $this->db = (new Database())->connect();
    }

    // 1. Lấy danh sách đánh giá (Dùng chung cho cả Client và Admin)
    public function list() {
        // Kiểm tra xem có tham số sach_id trên URL không
        $sachId = isset($_GET['sach_id']) ? $_GET['sach_id'] : null;

        // [CẬP NHẬT] Thêm u.Email vào câu SELECT để hỗ trợ tìm kiếm
        $sql = "SELECT r.*, 
                       IFNULL(u.HoTen, 'Người dùng ẩn danh') as HoTen,
                       u.Email, 
                       IFNULL(s.TenSach, 'Sách đã xóa') as TenSach
                FROM review r 
                LEFT JOIN users u ON r.UserID = u.UserID 
                LEFT JOIN sach s ON r.SachID = s.SachID";
        
        $params = [];

        // NẾU có sach_id (Client): Lọc theo sách và chỉ lấy review đã duyệt (TrangThai=1)
        if ($sachId) {
            $sql .= " WHERE r.SachID = ? AND r.TrangThai = 1";
            $params[] = $sachId;
        } 
        // NẾU KHÔNG có sach_id (Admin): Lấy tất cả
        else {
            // Admin: Lấy review đang hiển thị (TrangThai=1)
            $sql .= " WHERE r.TrangThai = 1"; 
        }

        $sql .= " ORDER BY r.NgayDanhGia DESC";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Tính toán thống kê
        $stats = [
            'total' => count($reviews),
            'avg' => 0,
            'stars' => [1=>0, 2=>0, 3=>0, 4=>0, 5=>0]
        ];

        $sumStars = 0;
        foreach ($reviews as $r) {
            $sao = intval($r['SoSao']);
            if ($sao >= 1 && $sao <= 5) {
                $stats['stars'][$sao]++;
                $sumStars += $sao;
            }
        }

        if ($stats['total'] > 0) {
            $stats['avg'] = round($sumStars / $stats['total'], 1);
        }

        jsonResponse(true, "Lấy dữ liệu thành công", [
            'reviews' => $reviews,
            'stats' => $stats
        ]);
    }

    // 2. Thêm đánh giá mới
    public function add() {
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (empty($data['UserID']) || empty($data['SachID']) || empty($data['SoSao'])) {
            jsonResponse(false, "Vui lòng đăng nhập và chọn số sao!");
            return;
        }

        try {
            $sql = "INSERT INTO review (UserID, SachID, SoSao, BinhLuan, NgayDanhGia, TrangThai) 
                    VALUES (?, ?, ?, ?, NOW(), 1)";
            $stmt = $this->db->prepare($sql);
            $result = $stmt->execute([
                $data['UserID'], 
                $data['SachID'], 
                $data['SoSao'], 
                $data['BinhLuan'] ?? ''
            ]);

            if ($result) {
                jsonResponse(true, "Gửi đánh giá thành công!");
            } else {
                jsonResponse(false, "Lỗi khi lưu đánh giá.");
            }
        } catch (Exception $e) {
            jsonResponse(false, "Lỗi server: " . $e->getMessage());
        }
    }

    // 3. Xóa đánh giá
    public function delete() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['ReviewID'])) {
            jsonResponse(false, "Thiếu ID đánh giá cần xóa");
            return;
        }

        try {
            $sql = "DELETE FROM review WHERE ReviewID = ?";
            $stmt = $this->db->prepare($sql);
            $result = $stmt->execute([$data['ReviewID']]);

            if ($result) {
                jsonResponse(true, "Đã xóa đánh giá thành công");
            } else {
                jsonResponse(false, "Lỗi khi xóa đánh giá");
            }
        } catch (Exception $e) {
            jsonResponse(false, "Lỗi server: " . $e->getMessage());
        }
    }
}
?>