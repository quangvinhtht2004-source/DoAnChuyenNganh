<?php
// backend/index.php

// Cấu hình CORS (Cho phép Frontend gọi API)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Xử lý preflight request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. Nạp Core & Config
require_once "./config/Database.php";
require_once "./core/Model.php";
require_once "./core/Controller.php";
require_once "./core/Router.php";
require_once "./helper/response.php";

// 2. Nạp Controllers (CẬP NHẬT MỚI)
// --- Nhóm User & Auth (Mới) ---
require_once "./controllers/AuthController.php";
require_once "./controllers/UserController.php";

// --- Nhóm Sản Phẩm & Danh Mục ---
require_once "./controllers/SachController.php";
require_once "./controllers/TheLoaiController.php";
require_once "./controllers/TacGiaController.php";
require_once "./controllers/NhaXuatBanController.php";

// --- Nhóm Đơn Hàng & Giỏ Hàng ---
require_once "./controllers/GioHangController.php";
require_once "./controllers/DonHangController.php";
require_once "./controllers/KhuyenMaiController.php";

// --- Nhóm Tương Tác ---
require_once "./controllers/ReviewController.php";

// (Đã xóa AdminController, KhachHangController, NhanVienController cũ)

// 3. Khởi tạo Router & Nạp Routes
$router = new Router();
require_once "./routes/api.php";

// 4. Chạy ứng dụng
$router->dispatch();
?>