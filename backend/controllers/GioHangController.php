<?php
require_once __DIR__ . "/../config/Database.php";
require_once __DIR__ . "/../models/GioHang.php";
require_once __DIR__ . "/../models/GioHangItem.php";
require_once __DIR__ . "/../helper/response.php";

class GioHangController {
    private $db;
    private $gioHangModel;
    private $itemModel;

    public function __construct() {
        $this->db = (new Database())->connect();
        $this->gioHangModel = new GioHang($this->db);
        $this->itemModel = new GioHangItem($this->db);
    }

    // =================================================================
    // 1. LẤY GIỎ HÀNG (Kèm thông tin tồn kho để Frontend hiển thị)
    // =================================================================
    public function get() {
        $userId = $_GET["user"] ?? 0;
        if ($userId == 0) {
            jsonResponse(false, "Chưa đăng nhập");
            return;
        }

        $cart = $this->gioHangModel->getOrCreate($userId);
        
        // Cần đảm bảo hàm getItems trong Model trả về cả cột 'SoLuong' của bảng Sach (đặt alias là SoLuongTon)
        // Nếu Model chưa hỗ trợ, bạn có thể sửa query trong Model. 
        // Tuy nhiên, logic chặn chính nằm ở add/update bên dưới.
        $items = $this->itemModel->getItems($cart['GioHangID']);
        
        jsonResponse(true, "Lấy dữ liệu thành công", $items);
    }

    // =================================================================
    // 2. THÊM VÀO GIỎ (Đã bổ sung logic cộng dồn số lượng)
    // =================================================================
    public function add() {
        $data = json_decode(file_get_contents("php://input"), true);

        $userId = $data['UserID'] ?? ($data['KhachHangID'] ?? 0); 
        $sachId = $data['SachID'] ?? 0;
        $soLuongThem = intval($data['SoLuong'] ?? 1);

        if ($userId == 0 || $sachId == 0) {
            jsonResponse(false, "Dữ liệu không hợp lệ");
            return;
        }

        // A. Lấy giỏ hàng của user
        $cart = $this->gioHangModel->getOrCreate($userId);
        $cartId = $cart['GioHangID'];

        // B. Lấy Tồn kho thực tế từ bảng Sách
        $stmt = $this->db->prepare("SELECT SoLuong, TenSach FROM Sach WHERE SachID = ?");
        $stmt->execute([$sachId]);
        $sach = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$sach) {
            jsonResponse(false, "Sách không tồn tại");
            return;
        }
        $tonKho = intval($sach['SoLuong']);

        // C. Kiểm tra số lượng đã có trong giỏ hàng
        $stmt2 = $this->db->prepare("SELECT SoLuong FROM GioHangItem WHERE GioHangID = ? AND SachID = ?");
        $stmt2->execute([$cartId, $sachId]);
        $inCart = $stmt2->fetchColumn();
        $daCoTrongGio = $inCart ? intval($inCart) : 0;

        // D. TÍNH TỔNG VÀ KIỂM TRA
        $tongSauKhiThem = $daCoTrongGio + $soLuongThem;

        if ($tongSauKhiThem > $tonKho) {
            // Thông báo chi tiết: Khách biết mình đã có bao nhiêu và kho còn bao nhiêu
            jsonResponse(false, "Kho chỉ còn $tonKho cuốn '{$sach['TenSach']}'. Bạn đã có $daCoTrongGio cuốn trong giỏ.");
            return;
        }

        // E. Nếu OK thì thêm vào
        if ($this->itemModel->addItem($cartId, $sachId, $soLuongThem)) {
            jsonResponse(true, "Đã thêm vào giỏ");
        } else {
            jsonResponse(false, "Lỗi khi thêm");
        }
    }

    // =================================================================
    // 3. CẬP NHẬT SỐ LƯỢNG (Khi bấm +/- trong giỏ hàng) - QUAN TRỌNG
    // =================================================================
    public function updateQuantity() {
        $data = json_decode(file_get_contents("php://input"), true);
        $itemId  = $data['ItemID'] ?? 0;
        $soLuongMoi = intval($data['SoLuong'] ?? 0);
        
        if ($itemId == 0 || $soLuongMoi < 1) {
             // Nếu số lượng < 1, nên gọi hàm remove hoặc báo lỗi
             jsonResponse(false, "Số lượng không hợp lệ");
             return;
        }

        // A. Lấy thông tin Tồn Kho của Sách tương ứng với ItemID này
        // (Phải JOIN bảng GioHangItem với bảng Sach)
        $sql = "SELECT s.SoLuong AS TonKho, s.TenSach 
                FROM GioHangItem ghi
                JOIN Sach s ON ghi.SachID = s.SachID
                WHERE ghi.ItemID = ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$itemId]);
        $info = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$info) {
            jsonResponse(false, "Sản phẩm không tìm thấy");
            return;
        }

        $tonKho = intval($info['TonKho']);

        // B. KIỂM TRA LOGIC
        if ($soLuongMoi > $tonKho) {
            // Chặn ngay lập tức
            jsonResponse(false, "Rất tiếc, kho chỉ còn $tonKho cuốn '{$info['TenSach']}'");
            return;
        }

        // C. Cập nhật nếu thỏa mãn
        $stmtUpdate = $this->db->prepare("UPDATE GioHangItem SET SoLuong = ? WHERE ItemID = ?");
        if ($stmtUpdate->execute([$soLuongMoi, $itemId])) {
            jsonResponse(true, "Đã cập nhật số lượng");
        } else {
            jsonResponse(false, "Lỗi cập nhật");
        }
    }

    // =================================================================
    // 4. XÓA SẢN PHẨM (Giữ nguyên)
    // =================================================================
    public function remove() {
        $data = json_decode(file_get_contents("php://input"), true);
        $itemId = $data['ItemID'] ?? 0;
        if ($this->itemModel->removeItem($itemId)) {
            jsonResponse(true, "Đã xóa sản phẩm");
        } else {
            jsonResponse(false, "Lỗi khi xóa");
        }
    }
}
?>