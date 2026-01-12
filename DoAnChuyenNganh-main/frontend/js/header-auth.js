// js/header-auth.js

document.addEventListener("DOMContentLoaded", function() {
    checkAuthAndRenderHeader();
});

function checkAuthAndRenderHeader() {
    const userJson = localStorage.getItem("user");
    
    // --- CÁC ELEMENT TRÊN HEADER ---
    const loginBtn = document.getElementById("loginBtn");
    const userInfoContainer = document.getElementById("userInfoContainer");
    const userNameDisplay = document.getElementById("userName");
    const userAvatar = document.getElementById("userAvatar"); // Nếu có
    const logoutBtn = document.getElementById("logoutBtn");

    // 1. TRƯỜNG HỢP KHÁCH VÃNG LAI (CHƯA ĐĂNG NHẬP)
    if (!userJson) {
        if(loginBtn) loginBtn.style.display = "flex";
        if(userInfoContainer) userInfoContainer.style.display = "none";
        return; // Cho phép xem trang web bình thường
    }

    try {
        const user = JSON.parse(userJson);

        // 2. [RÀNG BUỘC QUAN TRỌNG] NẾU LÀ ADMIN -> KHÔNG ĐƯỢC VÀO TRANG KHÁCH HÀNG
        // Logic: Nếu VaiTro KHÁC 'KhachHang' thì coi là Admin/Nhân viên
        if (user.VaiTro && user.VaiTro !== 'KhachHang') {
            
            // Ẩn toàn bộ nội dung trang web để admin không nhìn thấy giao diện khách
            document.body.style.display = 'none'; 
            
            alert("Bạn đang đăng nhập với quyền Quản trị viên (Admin).\nĐể mua sắm hoặc xem trang khách hàng, bạn bắt buộc phải ĐĂNG XUẤT tài khoản Admin trước.");
            
            // Chuyển hướng về lại Dashboard Admin
            // Giả định file này được gọi từ thư mục html/ (ngang hàng folder admin)
            window.location.href = "../admin/html/dashboard.html";
            return;
        }

        // 3. TRƯỜNG HỢP KHÁCH HÀNG HỢP LỆ -> HIỂN THỊ UI ĐĂNG NHẬP
        if(loginBtn) loginBtn.style.display = "none";
        if(userInfoContainer) userInfoContainer.style.display = "flex";
        
        if(userNameDisplay) userNameDisplay.textContent = user.HoTen || user.Username || "Khách hàng";
        
        // Tạo Avatar ký tự đầu (nếu có element)
        if(userAvatar && user.HoTen) {
            userAvatar.textContent = user.HoTen.charAt(0).toUpperCase();
        }

        // --- XỬ LÝ ĐĂNG XUẤT CHO KHÁCH HÀNG ---
        if (logoutBtn) {
            // Xóa sự kiện cũ để tránh duplicate
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            newLogoutBtn.addEventListener("click", function(e) {
                e.preventDefault();
                if(confirm("Bạn có chắc muốn đăng xuất?")) {
                    localStorage.removeItem("user");
                    window.location.href = "dangnhap.html";
                }
            });
        }

        // --- XỬ LÝ DROPDOWN MENU (nếu có) ---
        const userInfoClick = document.getElementById("userInfo");
        const userMenu = document.getElementById("userMenu");

        if (userInfoClick && userMenu) {
            // Reset event cũ
            const newUserInfoClick = userInfoClick.cloneNode(true);
            userInfoClick.parentNode.replaceChild(newUserInfoClick, userInfoClick);

            newUserInfoClick.addEventListener("click", function(e) {
                e.stopPropagation();
                // Toggle hiển thị menu
                if (userMenu.style.display === "block") {
                    userMenu.style.display = "none";
                } else {
                    userMenu.style.display = "block";
                }
            });

            // Click ra ngoài thì đóng menu
            document.addEventListener("click", function() {
                if(userMenu) userMenu.style.display = "none";
            });
        }

    } catch (e) {
        console.error("Lỗi xác thực header:", e);
        // Nếu lỗi JSON, xóa storage để reset
        localStorage.removeItem("user");
    }
}