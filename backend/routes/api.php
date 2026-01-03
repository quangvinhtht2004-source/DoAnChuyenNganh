<?php
// backend/routes/api.php

// 1. AUTH
$router->post('auth/login',    'AuthController@login');
$router->post('auth/register', 'AuthController@register');

// 2. USER
$router->get('user',           'UserController@list');
$router->post('user/create',   'UserController@createInternal');
// --- [BỔ SUNG MỚI] ---
$router->post('user/update',   'UserController@update'); // API Cập nhật nhân viên
$router->post('user/delete',   'UserController@delete'); // API Xóa tài khoản
// ---------------------

// 3. SÁCH
$router->get('sach',           'SachController@list');
$router->get('sach/chi-tiet',  'SachController@detail');
$router->get('sach/tim-kiem',  'SachController@search');
$router->get('sach/moi',       'SachController@newArrivals');
$router->get('sach/ban-chay',  'SachController@bestSellers');
$router->get('sach/loc-theo-danh-muc', 'SachController@getByTheLoai'); 

$router->post('sach/tao',      'SachController@create');
$router->post('sach/sua',      'SachController@update');
$router->post('sach/xoa',      'SachController@delete');

// 4. GIỎ HÀNG
$router->get('gio-hang',          'GioHangController@get');
$router->post('gio-hang/them',    'GioHangController@add');
$router->post('gio-hang/xoa',     'GioHangController@remove');
$router->post('gio-hang/cap-nhat','GioHangController@updateQuantity');

// 5. ĐƠN HÀNG
$router->post('don-hang/tao',      'DonHangController@create');
$router->get('don-hang/all',       'DonHangController@list');
$router->get('don-hang/chi-tiet',  'DonHangController@detail');
$router->post('don-hang/cap-nhat', 'DonHangController@updateStatus');

// 6. KHUYẾN MÃI, REVIEW...
$router->post('review/them', 'ReviewController@add');
$router->get('review',       'ReviewController@list');
$router->post('review/xoa',  'ReviewController@delete');

$router->get("khuyen-mai",           "KhuyenMaiController@list");
$router->get("khuyen-mai/chi-tiet",  "KhuyenMaiController@detail");
$router->get("khuyen-mai/kiem-tra",  "KhuyenMaiController@kiemTra");
$router->post("khuyen-mai/tao",      "KhuyenMaiController@create");
$router->post("khuyen-mai/sua",      "KhuyenMaiController@update");
$router->post("khuyen-mai/xoa",      "KhuyenMaiController@delete");
$router->post("khuyen-mai/toggle",   "KhuyenMaiController@toggleStatus");

$router->get('theloai',       'TheLoaiController@list');
$router->post('theloai/tao',  'TheLoaiController@create');
$router->post('theloai/sua',  'TheLoaiController@update');
$router->post('theloai/xoa',  'TheLoaiController@delete');

$router->get('tacgia',        'TacGiaController@list');
$router->post('tacgia/tao',   'TacGiaController@create');
$router->post('tacgia/sua',   'TacGiaController@update');
$router->post('tacgia/xoa',   'TacGiaController@delete');

$router->get("nhaxuatban",      "NhaXuatBanController@list");
$router->post("nhaxuatban/tao", "NhaXuatBanController@create");
$router->post("nhaxuatban/sua", "NhaXuatBanController@update");
$router->post("nhaxuatban/xoa", "NhaXuatBanController@delete");

?>