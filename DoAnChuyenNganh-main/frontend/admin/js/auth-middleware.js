// js/auth-middleware.js

(function() {
    // 1. LẤY THÔNG TIN USER TỪ STORAGE
    const userJson = localStorage.getItem("user");

    // 2. NẾU CHƯA ĐĂNG NHẬP -> CHUYỂN VỀ TRANG LOGIN
    if (!userJson) {
        alert("Vui lòng đăng nhập quyền Quản trị để truy cập!");
        // Giả định file này được gọi từ thư mục admin/html/
        window.location.href = "../../html/dangnhap.html"; 
        return;
    }

    try {
        const user = JSON.parse(userJson);

        // 3. NẾU LÀ KHÁCH HÀNG MÀ CỐ TÌNH VÀO ADMIN -> ĐUỔI VỀ TRANG CHỦ
        if (user.VaiTro === 'KhachHang') {
            alert("Tài khoản Khách hàng không có quyền truy cập trang Quản trị!");
            // Chuyển hướng về trang chủ bán hàng
            window.location.href = "../../html/index.html"; 
            return;
        }

        // 4. NẾU LÀ ADMIN -> CHO PHÉP Ở LẠI & HIỂN THỊ TÊN
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement) {
            adminNameElement.textContent = user.HoTen || "Admin";
        }

    } catch (e) {
        // Phòng trường hợp JSON lỗi
        console.error(e);
        localStorage.removeItem("user");
        window.location.href = "../../html/dangnhap.html";
    }

})();

// Hàm Đăng xuất dành riêng cho Admin (Gắn vào nút Đăng xuất trên Sidebar)
function logoutAdmin() {
    if(confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        localStorage.removeItem("user");
        localStorage.removeItem("adminInfo");
        window.location.href = "../../html/dangnhap.html";
    }
}