// =============================
//  CART.JS - XỬ LÝ GIỎ HÀNG (FULL VERSION + HEADER FIX)
// =============================

document.addEventListener("DOMContentLoaded", function() {
    // 1. Cập nhật giao diện Header (Hiển thị tên User)
    checkLoginHeader();

    // 2. Tải giỏ hàng
    loadCart();
});

// --- HÀM MỚI: XỬ LÝ HIỂN THỊ HEADER ---
function checkLoginHeader() {
    const userStr = localStorage.getItem("user");
    const loginBtn = document.getElementById("loginBtn");
    const userInfoContainer = document.getElementById("userInfoContainer");
    const userName = document.getElementById("userName");
    const logoutBtn = document.getElementById("logoutBtn");

    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            // Ẩn nút đăng nhập, hiện thông tin user
            if (loginBtn) loginBtn.style.display = "none";
            if (userInfoContainer) userInfoContainer.style.display = "flex";
            
            // Hiển thị tên (Ưu tiên HoTen -> Ten -> Username)
            if (userName) userName.innerText = user.HoTen || user.Ten || user.Username || "Khách hàng";

            // Xử lý đăng xuất
            if (logoutBtn) {
                logoutBtn.addEventListener("click", function(e) {
                    e.preventDefault();
                    if(confirm("Bạn có chắc muốn đăng xuất?")) {
                        localStorage.removeItem("user");
                        window.location.href = "dangnhap.html";
                    }
                });
            }
        } catch (e) {
            console.error("Lỗi parse user:", e);
        }
    } else {
        // Chưa đăng nhập: Hiện nút đăng nhập, ẩn user info
        if (loginBtn) loginBtn.style.display = "block"; 
        if (userInfoContainer) userInfoContainer.style.display = "none";
    }
}

// --- CÁC HÀM CŨ GIỮ NGUYÊN ---

// 1. TẢI GIỎ HÀNG TỪ API
async function loadCart() {
    const userJson = localStorage.getItem("user");
    if (!userJson) { showEmpty(); return; }

    const user = JSON.parse(userJson);
    const userId = user.UserID || user.id || user.KhachHangID;

    try {
        const url = `${AppConfig.getUrl('gio-hang')}?user=${userId}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status && data.data && data.data.length > 0) {
            renderCart(data.data);
        } else {
            showEmpty();
        }
    } catch (e) {
        console.error("Lỗi tải giỏ hàng:", e);
        showEmpty();
    }
}

// 2. RENDER GIAO DIỆN
function renderCart(items) {
    const listContainer = document.getElementById("cartItemsList");
    const content = document.getElementById("cartContent");
    const emptyMsg = document.getElementById("emptyCartMessage");
    
    const tempTotalEl = document.getElementById("tempTotal");
    const cartTotalEl = document.getElementById("cartTotal");
    const cartCountText = document.getElementById("cartCountText"); 

    if (content) content.style.display = "grid"; 
    if (emptyMsg) emptyMsg.style.display = "none";

    let html = "";
    let grandTotal = 0;
    let totalItems = 0;

    items.forEach(item => {
        const thanhTien = item.GiaBan * item.SoLuong;
        grandTotal += thanhTien;
        totalItems += parseInt(item.SoLuong);

        // Xử lý ảnh
        const imgUrl = item.AnhBia && item.AnhBia !== "null" 
            ? (item.AnhBia.startsWith("http") ? item.AnhBia : `../img/${item.AnhBia}`) 
            : "https://via.placeholder.com/80";
        
        const maxStock = item.TonKho || item.SoLuongTon || 9999; 

        html += `
        <div class="cart-item-row">
            <div class="c-product">
                <img src="${imgUrl}" alt="${item.TenSach}" onerror="this.src='https://via.placeholder.com/80'">
                <div class="c-info">
                    <div class="c-name">
                        <a href="chitietsanpham.html?id=${item.SachID}" style="text-decoration:none; color:inherit; font-weight:500;">
                            ${item.TenSach}
                        </a>
                    </div>
                    <span class="c-status">Kho còn: ${maxStock < 9999 ? maxStock : 'Sẵn hàng'}</span>
                </div>
            </div>

            <div class="c-qty">
                <div class="qty-stepper">
                    <button type="button" onclick="updateQuantity(${item.ItemID}, ${item.SoLuong}, -1, ${maxStock})">−</button>
                    <input type="text" value="${item.SoLuong}" readonly>
                    <button type="button" onclick="updateQuantity(${item.ItemID}, ${item.SoLuong}, 1, ${maxStock})">+</button>
                </div>
            </div>

            <div class="c-total">
                ${formatMoney(thanhTien)}
            </div>

            <div class="c-delete">
                <button class="btn-remove" onclick="removeItem(${item.ItemID})" title="Xóa sản phẩm">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
        `;
    });

    if (listContainer) listContainer.innerHTML = html;
    
    if (tempTotalEl) tempTotalEl.innerText = formatMoney(grandTotal);
    
    const shippingFee = 30000; 
    const finalTotal = grandTotal + shippingFee;

    if (cartTotalEl) cartTotalEl.innerText = formatMoney(finalTotal);
    if (cartCountText) cartCountText.innerText = `${totalItems} sản phẩm`;
}

// 3. XỬ LÝ KHI GIỎ HÀNG TRỐNG
function showEmpty() {
    const content = document.getElementById("cartContent");
    const emptyMsg = document.getElementById("emptyCartMessage");
    const cartCountText = document.getElementById("cartCountText");

    if (content) content.style.display = "none";
    if (emptyMsg) emptyMsg.style.display = "block"; 
    if (cartCountText) cartCountText.innerText = "0 sản phẩm";
    
    const badge = document.getElementById("cartBadge");
    if(badge) badge.innerText = "0";
}

// 4. CẬP NHẬT SỐ LƯỢNG
async function updateQuantity(itemId, currentQty, change, maxStock) {
    let newQty = parseInt(currentQty) + parseInt(change);

    if (newQty < 1) return;

    if (change > 0 && newQty > maxStock) {
        alert(`Kho chỉ còn ${maxStock} sản phẩm!`);
        return;
    }

    try {
        const url = AppConfig.getUrl("gio-hang/cap-nhat");
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ItemID: itemId, SoLuong: newQty })
        });

        const result = await res.json();
        if (result.status) {
            loadCart(); 
        } else {
            alert(result.message || "Lỗi cập nhật");
        }
    } catch (e) {
        console.error(e);
    }
}

// 5. XÓA SẢN PHẨM
async function removeItem(itemId) {
    if (!confirm("Bạn muốn xóa sản phẩm này khỏi giỏ hàng?")) return;

    try {
        const url = AppConfig.getUrl("gio-hang/xoa");
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ItemID: itemId })
        });

        const result = await res.json();
        if (result.status) {
            loadCart();
        } else {
            alert(result.message);
        }
    } catch (e) {
        console.error(e);
    }
}

function formatMoney(num) {
    return Number(num).toLocaleString("vi-VN") + "đ";
}