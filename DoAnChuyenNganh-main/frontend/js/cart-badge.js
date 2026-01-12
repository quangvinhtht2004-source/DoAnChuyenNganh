// =============================
// CART-BADGE.JS - Cập nhật số lượng giỏ hàng trên Header
// =============================

document.addEventListener("DOMContentLoaded", function() {
    updateCartBadge();
});

// Cập nhật badge giỏ hàng
async function updateCartBadge() {
    const badge = document.querySelector('.badge'); // Element hiển thị số đỏ
    if (!badge) return;
    
    const userJson = localStorage.getItem("user");
    
    if (!userJson) {
        badge.style.display = 'none';
        return;
    }

    const user = JSON.parse(userJson);

    // --- QUAN TRỌNG: Lấy ID người dùng linh hoạt ---
    const userId = user.UserID || user.id || user.KhachHangID;

    if (!userId) {
        // Có user nhưng không có ID hợp lệ
        badge.style.display = 'none';
        return;
    }

    try {
        const url = `${AppConfig.getUrl('gio-hang')}?user=${userId}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status && data.data && data.data.length > 0) {
            // Cộng dồn số lượng của từng item (item.SoLuong)
            const totalItems = data.data.reduce((sum, item) => sum + parseInt(item.SoLuong), 0);
            
            badge.textContent = totalItems;
            // Chỉ hiện badge nếu số lượng > 0
            badge.style.display = totalItems > 0 ? 'flex' : 'none';
        } else {
            badge.style.display = 'none';
        }

    } catch (e) {
        console.error("Lỗi tải badge giỏ hàng:", e);
        badge.style.display = 'none';
    }
}

// Gắn hàm vào window để các file khác có thể gọi (ví dụ sau khi Thêm vào giỏ)
window.updateCartBadge = updateCartBadge;

// Lắng nghe sự kiện tùy chỉnh khi giỏ hàng thay đổi
window.addEventListener('cartUpdated', updateCartBadge);