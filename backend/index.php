<?php
// backend/index.php

// -----------------------------------------------------------------------------
// 1. CẤU HÌNH CORS CHUẨN (QUAN TRỌNG)
// -----------------------------------------------------------------------------
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Credentials: true"); // Cho phép gửi Cookie
    header("Access-Control-Max-Age: 86400");
}

header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");         
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

// -----------------------------------------------------------------------------
// 2. KHỞI ĐỘNG SESSION (ĐÃ SỬA LỖI MẤT SESSION)
// -----------------------------------------------------------------------------
if (session_status() === PHP_SESSION_NONE) {
    
    session_start();
}

// -----------------------------------------------------------------------------
// 3. NẠP FILE HỆ THỐNG
// -----------------------------------------------------------------------------
require_once "./config/Database.php";
require_once "./core/Model.php";
require_once "./core/Controller.php";
require_once "./core/Router.php";
require_once "./helper/response.php";
require_once "./helper/SendMail.php";

// Nạp Controllers
require_once "./controllers/AuthController.php";
require_once "./controllers/UserController.php";
require_once "./controllers/SachController.php";
require_once "./controllers/TheLoaiController.php";
require_once "./controllers/TacGiaController.php";
require_once "./controllers/NhaXuatBanController.php";
require_once "./controllers/GioHangController.php";
require_once "./controllers/DonHangController.php";
require_once "./controllers/KhuyenMaiController.php";
require_once "./controllers/ReviewController.php";

// Khởi tạo Router
$router = new Router();
require_once "./routes/api.php";

$router->dispatch();
?>