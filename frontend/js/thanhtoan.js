document.addEventListener("DOMContentLoaded", () => {
    // ============================================================
    // 1. KHỞI TẠO & KIỂM TRA ĐĂNG NHẬP + UPDATE HEADER
    // ============================================================
    const userStr = localStorage.getItem("user");
    
    // Kiểm tra nếu chưa đăng nhập -> Redirect
    if (!userStr) {
        alert("Bạn chưa đăng nhập. Vui lòng đăng nhập để thanh toán!");
        window.location.href = "dangnhap.html";
        return;
    }
    
    let user;
    try {
        user = JSON.parse(userStr);
    } catch (e) {
        localStorage.removeItem("user");
        window.location.href = "dangnhap.html";
        return;
    }

    // --- LOGIC MỚI: CẬP NHẬT HEADER TRANG THANH TOÁN ---
    const loginBtn = document.getElementById("loginBtn");
    const userInfoContainer = document.getElementById("userInfoContainer");
    const userNameDisplay = document.getElementById("userName");
    const logoutBtn = document.getElementById("logoutBtn");

    if (loginBtn) loginBtn.style.display = "none"; // Ẩn nút Đăng nhập
    if (userInfoContainer) userInfoContainer.style.display = "flex"; // Hiện User info
    if (userNameDisplay) {
        userNameDisplay.innerText = user.HoTen || user.Ten || user.Username || "Khách hàng";
    }

    // Gán sự kiện Đăng xuất ngay tại trang này
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if(confirm("Bạn muốn đăng xuất?")) {
                localStorage.removeItem("user");
                window.location.href = "dangnhap.html";
            }
        });
    }
    // ----------------------------------------------------

    const userId = user.UserID || user.id || user.KhachHangID; 
    
    // Biến lưu trữ thông tin giảm giá
    let currentDiscount = { 
        code: null, 
        khuyenMaiID: null, 
        value: 0, 
        amount: 0, 
        type: 'tien' 
    };
    
    const SHIPPING_FEE = 30000; // Phí ship cố định

    // Load giỏ hàng ngay khi vào trang
    loadCheckoutCart(userId);

    // Điền tự động thông tin người dùng vào form nếu có
    if(user.HoTen) document.getElementById("fullname").value = user.HoTen;
    if(user.SoDienThoai) document.getElementById("phone").value = user.SoDienThoai;
    if(user.Email) document.getElementById("email").value = user.Email;
    if(user.DiaChi) document.getElementById("address").value = user.DiaChi;


    // ============================================================
    // 2. XỬ LÝ ÁP DỤNG VOUCHER
    // ============================================================
    const applyBtn = document.getElementById("apply-voucher-btn");
    
    if(applyBtn) {
        applyBtn.addEventListener("click", async () => {
            const voucherInput = document.getElementById("voucher-input");
            const voucherCode = voucherInput.value.trim().toUpperCase();
            const messageBox = document.getElementById("voucher-message");

            // Validate đầu vào
            if (!voucherCode) {
                messageBox.innerHTML = '<span style="color: #ff4444;">Vui lòng nhập mã!</span>';
                return;
            }

            resetDiscount();
            recalculateTotal();

            messageBox.innerHTML = '<span style="color: #666;">Đang kiểm tra...</span>';
            
            const result = await checkVoucherCode(voucherCode);

            if (result.valid) {
                currentDiscount = result;
                
                messageBox.innerHTML = `<span style="color: #166534; font-weight:500;">
                    <i class="fa-solid fa-check-circle"></i> ${result.description}
                </span>`;
                
                recalculateTotal();
            } else {
                messageBox.innerHTML = `<span style="color: #dc2626;">
                    <i class="fa-solid fa-circle-exclamation"></i> ${result.message}
                </span>`;
            }
        });
    }

    function resetDiscount() {
        currentDiscount = { code: null, khuyenMaiID: null, value: 0, amount: 0, type: 'tien' };
    }

    // ============================================================
    // 3. XỬ LÝ ĐẶT HÀNG (CHECKOUT)
    // ============================================================
    const checkoutForm = document.getElementById("checkoutForm");
    if(checkoutForm) {
        checkoutForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const btnSubmit = document.querySelector(".btn-confirm-checkout");
            const originalText = btnSubmit.innerText;

            const fullname = document.getElementById("fullname").value.trim();
            const phone = document.getElementById("phone").value.trim();
            const address = document.getElementById("address").value.trim();
            const note = document.getElementById("note").value.trim();
            const email = document.getElementById("email").value.trim();
            
            const paymentMethodElem = document.querySelector("input[name=payment_method]:checked");
            const paymentMethod = paymentMethodElem ? paymentMethodElem.value : "COD";

            if(!fullname || !phone || !address) {
                alert("Vui lòng điền đầy đủ thông tin giao hàng!");
                return;
            }

            btnSubmit.innerText = "ĐANG XỬ LÝ...";
            btnSubmit.disabled = true;

            try {
                const orderData = {
                    UserID: userId,
                    HoTenNguoiNhan: fullname,
                    SoDienThoai: phone,
                    DiaChiGiao: address,
                    GhiChu: note + (email ? ` | Email: ${email}` : ""),
                    PhuongThucTT: paymentMethod,
                    
                    MaGiamGia: currentDiscount.code || "",
                    KhuyenMaiID: currentDiscount.khuyenMaiID || null,
                    SoTienGiam: currentDiscount.amount 
                };

                const res = await fetch(AppConfig.getUrl("don-hang/tao"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(orderData)
                });

                const data = await res.json();
                
                if (data.status) {
                    alert("Đặt hàng thành công! Mã đơn: " + data.data.DonHangID);
                    window.location.href = "index.html"; 
                } else {
                    alert("Lỗi đặt hàng: " + (data.message || "Không xác định"));
                }

            } catch (err) {
                console.error("Checkout Error:", err);
                alert("Lỗi kết nối Server! Vui lòng thử lại.");
            } finally {
                btnSubmit.innerText = originalText;
                btnSubmit.disabled = false;
            }
        });
    }

    // ============================================================
    // 4. CÁC HÀM HỖ TRỢ
    // ============================================================

    function getSubtotalValue() {
        const subtotalText = document.getElementById("checkout-subtotal").textContent;
        return parseInt(subtotalText.replace(/[^\d]/g, '') || 0);
    }

    function recalculateTotal() {
        const subtotal = getSubtotalValue();
        let discountAmount = 0;

        if (currentDiscount.serverCalculatedAmount !== undefined) {
            discountAmount = currentDiscount.serverCalculatedAmount;
        } else if (currentDiscount.code) {
            if (currentDiscount.type === 'phantram') {
                discountAmount = Math.round(subtotal * currentDiscount.value / 100);
            } else {
                discountAmount = currentDiscount.value;
            }
        }
        
        if(discountAmount > subtotal) discountAmount = subtotal;
        currentDiscount.amount = discountAmount;

        const finalTotal = subtotal + SHIPPING_FEE - discountAmount;

        const discountRow = document.getElementById("discount-row");
        if (discountAmount > 0) {
            discountRow.style.display = "flex";
            document.getElementById("discount-code").textContent = currentDiscount.code;
            document.getElementById("checkout-discount").textContent = "-" + formatMoney(discountAmount);
        } else {
            discountRow.style.display = "none";
        }

        document.getElementById("checkout-total").textContent = formatMoney(finalTotal);
    }

    async function checkVoucherCode(code) {
        try {
            const currentTotal = getSubtotalValue();
            const url = AppConfig.getUrl(`khuyen-mai/kiem-tra?code=${code}&total=${currentTotal}`);
            const res = await fetch(url);
            const data = await res.json();

            if (data.status && data.data) {
                const responseData = data.data; 
                const voucherInfo = responseData.info || responseData; 
                const serverCalc = responseData.tien_giam || 0;

                return {
                    valid: true,
                    khuyenMaiID: voucherInfo.KhuyenMaiID,
                    code: voucherInfo.Code,
                    type: voucherInfo.LoaiKM ? voucherInfo.LoaiKM.toLowerCase() : 'phantram',
                    value: Number(voucherInfo.GiaTri),
                    serverCalculatedAmount: Number(serverCalc),
                    description: (voucherInfo.LoaiKM === 'phantram') 
                        ? `Giảm ${voucherInfo.GiaTri}% đơn hàng` 
                        : `Giảm trực tiếp ${formatMoney(voucherInfo.GiaTri)}`
                };
            }
            return { valid: false, message: data.message || "Mã không hợp lệ!" };
        } catch (err) {
            console.error(err);
            return { valid: false, message: "Lỗi kết nối Server!" };
        }
    }

    async function loadCheckoutCart(userId) {
        try {
            const res = await fetch(AppConfig.getUrl("gio-hang?user=" + userId));
            const data = await res.json();
            const listBox = document.getElementById("checkout-order-list");
            const totalItemsCount = document.getElementById("totalItemsCount");

            if (!data.status || !data.data || data.data.length === 0) {
                listBox.innerHTML = `<p style="text-align:center; padding: 20px;">Giỏ hàng trống.</p>`;
                return;
            }

            let html = "";
            let subtotal = 0;
            let count = 0;

            data.data.forEach(item => {
                const price = parseInt(item.GiaBan || item.Gia || 0); 
                const qty = parseInt(item.SoLuong || 1);
                subtotal += price * qty;
                count += qty;
                
                let imgUrl = "https://via.placeholder.com/80";
                if (item.AnhBia && item.AnhBia !== "null") {
                    imgUrl = item.AnhBia.startsWith("http") ? item.AnhBia : `../img/${item.AnhBia}`;
                }

                html += `
                <div class="co-item">
                    <img src="${imgUrl}" class="co-img" onerror="this.src='https://via.placeholder.com/60'">
                    <div class="co-info">
                        <div class="co-name">${item.TenSach}</div>
                        <div class="co-qty">Số lượng: <strong>${qty}</strong></div>
                    </div>
                    <div class="co-price">${formatMoney(price * qty)}</div>
                </div>`;
            });

            listBox.innerHTML = html;
            if(totalItemsCount) totalItemsCount.innerText = count;

            document.getElementById("checkout-subtotal").textContent = formatMoney(subtotal);
            document.getElementById("checkout-total").textContent = formatMoney(subtotal + SHIPPING_FEE);
            
        } catch (e) {
            console.error("Lỗi load giỏ hàng:", e);
        }
    }

    function formatMoney(num) {
        return Math.round(Number(num)).toLocaleString("vi-VN") + "đ";
    }
});