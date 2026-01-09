<?php
// backend/routes/api.php

// =============================================================
// 1. AUTHENTICATION (Đăng nhập - Đăng ký - OTP)
// =============================================================
$router->post('auth/login',    'AuthController@login');
$router->post('auth/register', 'AuthController@register');
$router->post('auth/forgot-password', 'AuthController@forgotPassword'); 
$router->post('auth/verify-otp-reset', 'AuthController@verifyOtpReset');
$router->post('auth/reset-password',  'AuthController@resetPassword');  

// [BỔ SUNG QUAN TRỌNG] Route gửi OTP
// Nếu thiếu dòng này -> Lỗi 404 -> Frontend báo "Lỗi kết nối"
$router->post('auth/send-otp', 'AuthController@sendOtp'); 


// =============================================================
// 2. USER (Quản lý người dùng)
// =============================================================
$router->get('user',           'UserController@list');
$router->post('user/create',   'UserController@createInternal');
$router->post('user/update',   'UserController@update'); 
$router->post('user/delete',   'UserController@delete');


// =============================================================
// 3. SÁCH (Sản phẩm)
// =============================================================
$router->get('sach',           'SachController@list');
$router->get('sach/chi-tiet',  'SachController@detail');
$router->get('sach/tim-kiem',  'SachController@search');
$router->get('sach/moi',       'SachController@newArrivals');
$router->get('sach/ban-chay',  'SachController@bestSellers');
$router->get('sach/loc-theo-danh-muc', 'SachController@getByTheLoai'); 

$router->post('sach/tao',      'SachController@create');
$router->post('sach/sua',      'SachController@update');
$router->post('sach/xoa',      'SachController@delete');


// =============================================================
// 4. GIỎ HÀNG & ĐƠN HÀNG
// =============================================================
$router->get('gio-hang',        'GioHangController@get'); 
$router->post('gio-hang/them',  'GioHangController@add');
$router->post('gio-hang/cap-nhat', 'GioHangController@updateQuantity');
$router->post('gio-hang/xoa',   'GioHangController@remove');

$router->post('don-hang/tao',           'DonHangController@create');
$router->get('don-hang/lich-su',        'DonHangController@history');
$router->get('don-hang/chi-tiet',       'DonHangController@detail');
$router->get('don-hang/danh-sach-admin','DonHangController@listAdmin');
$router->get('don-hang/all',           'DonHangController@list');
$router->post('don-hang/cap-nhat',     'DonHangController@updateStatus');


// =============================================================
// 5. REVIEW (Đánh giá)
// =============================================================
$router->post('review/them', 'ReviewController@add');
$router->get('review',       'ReviewController@list');
$router->post('review/xoa',  'ReviewController@delete');


// =============================================================
// 6. KHUYẾN MÃI
// =============================================================
$router->get("khuyen-mai",           "KhuyenMaiController@list");
$router->get("khuyen-mai/chi-tiet",  "KhuyenMaiController@detail");
$router->get("khuyen-mai/kiem-tra",  "KhuyenMaiController@kiemTra");
$router->post("khuyen-mai/tao",      "KhuyenMaiController@create");
$router->post("khuyen-mai/sua",      "KhuyenMaiController@update");
$router->post("khuyen-mai/xoa",      "KhuyenMaiController@delete");
$router->post("khuyen-mai/toggle",   "KhuyenMaiController@toggleStatus");


// =============================================================
// 7. DANH MỤC KHÁC (Thể loại, Tác giả, NXB)
// =============================================================
// Thể loại
$router->get('theloai',       'TheLoaiController@list');
$router->post('theloai/tao',  'TheLoaiController@create');
$router->post('theloai/sua',  'TheLoaiController@update');
$router->post('theloai/xoa',  'TheLoaiController@delete');

// Tác giả
$router->get('tacgia',        'TacGiaController@list');
$router->post('tacgia/tao',   'TacGiaController@create');
$router->post('tacgia/sua',   'TacGiaController@update');
$router->post('tacgia/xoa',   'TacGiaController@delete');

// Nhà xuất bản
$router->get('nhaxuatban',      'NhaXuatBanController@list');
$router->post('nhaxuatban/tao', 'NhaXuatBanController@create');
$router->post('nhaxuatban/sua', 'NhaXuatBanController@update');
$router->post('nhaxuatban/xoa', 'NhaXuatBanController@delete');

?>