document.addEventListener("DOMContentLoaded", () => {
    // ============================================================
    // CẤU HÌNH HỆ THỐNG
    // ============================================================
    const STORE_INFO = {
        ADDRESS: "180 Cao Lỗ, P.4, Q.8, TP.HCM",
        SHIPPING_FEE: 30000 
    };

    const BANK_CONFIG = {
        ID: "MB",          
        ACC_NO: "01894373852",  
        TEMPLATE: "compact2"   
    };

    // ============================================================
    // 1. KIỂM TRA ĐĂNG NHẬP & HEADER
    // ============================================================
    const userStr = localStorage.getItem("user");
    if (!userStr) {
        alert("Bạn chưa đăng nhập. Vui lòng đăng nhập để thanh toán!");
        window.location.href = "dangnhap.html";
        return;
    }
    
    let user;
    try { user = JSON.parse(userStr); } catch (e) {
        localStorage.removeItem("user"); window.location.href = "dangnhap.html"; return;
    }
    const userId = user.UserID || user.id || user.KhachHangID;

    // Hiển thị User Info
    const userNameDisplay = document.getElementById("userName");
    const userInfoContainer = document.getElementById("userInfoContainer");
    const loginBtn = document.getElementById("loginBtn");

    if (userNameDisplay) userNameDisplay.innerText = user.HoTen || "Khách hàng";
    if (userInfoContainer) userInfoContainer.style.display = "flex";
    if (loginBtn) loginBtn.style.display = "none";

    // Xử lý nút Đăng xuất
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("user");
            alert("Đăng xuất thành công!");
            window.location.href = "dangnhap.html";
        });
    }

    // ============================================================
    // 2. LOGIC TRANG THANH TOÁN
    // ============================================================
    let currentDiscount = { code: null, amount: 0 };
    let currentShippingFee = STORE_INFO.SHIPPING_FEE;

    // Điền thông tin user vào form
    if(user.HoTen) document.getElementById("fullname").value = user.HoTen;
    if(user.SoDienThoai) document.getElementById("phone").value = user.SoDienThoai;
    if(user.Email) document.getElementById("email").value = user.Email;
    if(user.DiaChi) document.getElementById("address").value = user.DiaChi;

    // Load giỏ hàng
    loadCheckoutCart(userId);

    // --- XỬ LÝ MÃ GIẢM GIÁ (ĐÃ SỬA LỖI) ---
    const applyBtn = document.getElementById("apply-voucher-btn");
    const voucherMsg = document.getElementById("voucher-message");

    if(applyBtn) {
        applyBtn.addEventListener("click", async () => {
            const codeInput = document.getElementById("voucher-input");
            const code = codeInput.value.trim().toUpperCase();
            
            if(!code) {
                voucherMsg.innerHTML = `<span class="voucher-error">Vui lòng nhập mã!</span>`;
                return;
            }

            // 1. Hiệu ứng Loading
            const originalText = applyBtn.innerText;
            applyBtn.innerText = "Đang kiểm tra...";
            applyBtn.disabled = true;
            voucherMsg.innerHTML = "";

            try {
                const subtotal = getSubtotalValue();

                // ✅ ĐÃ SỬA: Gọi API bằng GET với query parameters
                const url = `${AppConfig.getUrl("khuyen-mai/kiem-tra")}?code=${encodeURIComponent(code)}&total=${subtotal}`;
                
                const res = await fetch(url, {
                    method: "GET",  // Đổi thành GET
                    headers: { "Content-Type": "application/json" }
                });

                const result = await res.json();
                console.log("Kết quả kiểm tra voucher:", result); // Debug

                // 3. XỬ LÝ KẾT QUẢ
                if (result.status) {
                    // Thành công: API trả về số tiền được giảm
                    const discountAmount = result.data.SoTienGiam || 0;
                    applyVoucherSuccess(code, discountAmount);
                } else {
                    // Thất bại (Mã sai, hết hạn, chưa đủ đơn tối thiểu...)
                    voucherMsg.innerHTML = `<span class="voucher-error">${result.message || "Mã không hợp lệ!"}</span>`;
                    resetVoucher();
                }

            } catch (e) {
                console.error("Lỗi check voucher:", e);
                voucherMsg.innerHTML = `<span class="voucher-error">Lỗi kết nối Server! Vui lòng thử lại.</span>`;
                resetVoucher();
            } finally {
                applyBtn.innerText = originalText;
                applyBtn.disabled = false;
            }
        });
    }

    function applyVoucherSuccess(code, amount) {
        currentDiscount = { code: code, amount: amount };
        voucherMsg.innerHTML = `<span class="voucher-success">✅ Áp dụng mã <b>${code}</b> thành công! Giảm ${formatMoney(amount)}</span>`;
        
        const discountRow = document.getElementById("discount-row");
        const discountCodeDisplay = document.getElementById("discount-code");
        const discountValueDisplay = document.getElementById("checkout-discount");

        if(discountRow) discountRow.style.display = "flex";
        if(discountCodeDisplay) discountCodeDisplay.innerText = code;
        if(discountValueDisplay) discountValueDisplay.innerText = "-" + formatMoney(amount);

        recalculateTotal();
    }

    function resetVoucher() {
        currentDiscount = { code: null, amount: 0 };
        const discountRow = document.getElementById("discount-row");
        if(discountRow) discountRow.style.display = "none";
        recalculateTotal();
    }

    // --- XỬ LÝ CHỌN PHƯƠNG THỨC THANH TOÁN ---
    const paymentRadios = document.querySelectorAll('input[name="payment_method"]');
    const addressContainer = document.getElementById("address-container");
    const shippingDisplay = document.getElementById("shipping-fee-display");

    function handlePaymentMethodChange() {
        const method = document.querySelector('input[name="payment_method"]:checked').value;
        
        if (method === 'STORE') {
            addressContainer.style.display = 'none'; 
            currentShippingFee = 0; 
        } else {
            addressContainer.style.display = 'block';
            currentShippingFee = STORE_INFO.SHIPPING_FEE;
        }
        
        if(shippingDisplay) shippingDisplay.textContent = formatMoney(currentShippingFee);
        recalculateTotal(); 
    }

    paymentRadios.forEach(radio => radio.addEventListener('change', handlePaymentMethodChange));
    handlePaymentMethodChange(); 

    // ============================================================
    // 3. LOGIC QR CODE & TIMER
    // ============================================================
    const qrModal = document.getElementById("qrModal");
    const closeModalBtn = document.querySelector(".close-modal");
    const qrImage = document.getElementById("qrImage");
    const qrOverlay = document.getElementById("qrOverlay");
    const timerDisplay = document.getElementById("timer");
    
    let timerInterval;

    function hideModal() {
        if(qrModal) qrModal.classList.remove("active");
        clearInterval(timerInterval);
    }
    if(closeModalBtn) closeModalBtn.addEventListener("click", hideModal);

    function showQRModal(amount) {
        const addInfo = "Thanh toan don hang VKD";
        const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.ID}-${BANK_CONFIG.ACC_NO}-${BANK_CONFIG.TEMPLATE}.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}`;
        
        if(qrImage) qrImage.src = qrUrl;
        const qrAmountDisplay = document.getElementById("qrAmountDisplay");
        if(qrAmountDisplay) qrAmountDisplay.innerText = formatMoney(amount);
        
        if(qrModal) qrModal.classList.add("active");
        startTimer(5 * 60); 
    }

    function startTimer(duration) {
        clearInterval(timerInterval);
        if(qrOverlay) qrOverlay.style.display = "none";
        
        let timer = duration;
        updateTimerText(timer);

        timerInterval = setInterval(() => {
            timer--;
            updateTimerText(timer);

            if (timer <= 0) {
                clearInterval(timerInterval);
                if(qrOverlay) qrOverlay.style.display = "flex"; 
            }
        }, 1000);
    }

    function updateTimerText(seconds) {
        if(!timerDisplay) return;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        timerDisplay.textContent = `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
    }

    const refreshQrBtn = document.getElementById("refreshQrBtn");
    if(refreshQrBtn) {
        refreshQrBtn.addEventListener("click", () => {
            startTimer(5 * 60);
        });
    }

    const confirmPaidBtn = document.getElementById("confirmPaidBtn");
    if(confirmPaidBtn) {
        confirmPaidBtn.addEventListener("click", () => {
            submitOrderData();
            hideModal();
        });
    }

    // ============================================================
    // 4. SUBMIT FORM (CHECKOUT)
    // ============================================================
    const checkoutForm = document.getElementById("checkoutForm");
    
    if(checkoutForm) {
        checkoutForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const fullname = document.getElementById("fullname").value.trim();
            const phone = document.getElementById("phone").value.trim();
            const method = document.querySelector('input[name="payment_method"]:checked').value;
            let address = document.getElementById("address").value.trim();

            if (!fullname || !phone) {
                alert("Vui lòng nhập họ tên và số điện thoại!");
                return;
            }

            if (method !== 'STORE' && !address) {
                alert("Vui lòng nhập địa chỉ giao hàng!");
                document.getElementById("address").focus();
                return;
            }

            if (method === 'BANKING') {
                const total = getCurrentTotalAmount();
                showQRModal(total);
            } else {
                submitOrderData();
            }
        });
    }

    async function submitOrderData() {
        const fullname = document.getElementById("fullname").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const email = document.getElementById("email").value.trim();
        const note = document.getElementById("note").value.trim();
        const method = document.querySelector('input[name="payment_method"]:checked').value;
        
        let address = document.getElementById("address").value.trim();
        if (method === 'STORE') address = STORE_INFO.ADDRESS;

        const btnSubmit = document.querySelector(".btn-confirm-checkout");
        const originalText = btnSubmit.innerText;
        btnSubmit.disabled = true; btnSubmit.innerText = "ĐANG XỬ LÝ...";

        try {
            const orderData = {
                UserID: userId,
                HoTenNguoiNhan: fullname,
                SoDienThoai: phone,
                DiaChiGiao: address,
                GhiChu: note + (email ? ` | Email: ${email}` : ""),
                PhuongThucTT: method,
                MaGiamGia: currentDiscount.code || "",
                SoTienGiam: currentDiscount.amount
            };

            const res = await fetch(AppConfig.getUrl("don-hang/tao"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
            });
            const data = await res.json();

            if (data.status) {
                alert("✅ Đặt hàng thành công! Mã đơn: " + data.data.DonHangID);
                window.location.href = "index.html"; 
            } else {
                alert("❌ Lỗi: " + (data.message || "Không xác định"));
            }

        } catch (err) {
            console.error(err);
            alert("❌ Lỗi kết nối server. Vui lòng thử lại!");
        } finally {
            btnSubmit.disabled = false; btnSubmit.innerText = originalText;
        }
    }

    // ============================================================
    // 5. HELPER FUNCTIONS
    // ============================================================
    function getSubtotalValue() {
        const el = document.getElementById("checkout-subtotal");
        return el ? parseInt(el.textContent.replace(/[^\d]/g, '') || 0) : 0;
    }
    
    function getCurrentTotalAmount() {
        const el = document.getElementById("checkout-total");
        return el ? parseInt(el.textContent.replace(/[^\d]/g, '') || 0) : 0;
    }

    function recalculateTotal() {
        const subtotal = getSubtotalValue();
        let discount = currentDiscount.amount;

        if(discount > subtotal) discount = subtotal;

        const finalTotal = subtotal + currentShippingFee - discount;
        
        const totalEl = document.getElementById("checkout-total");
        if(totalEl) totalEl.textContent = formatMoney(finalTotal);
        
        const discountRow = document.getElementById("discount-row");
        const discountVal = document.getElementById("checkout-discount");
        
        if (discount > 0) {
            if(discountRow) discountRow.style.display = "flex";
            if(discountVal) discountVal.textContent = "-" + formatMoney(discount);
        } else {
            if(discountRow) discountRow.style.display = "none";
        }
    }

    async function loadCheckoutCart(uid) {
        try {
            const res = await fetch(AppConfig.getUrl("gio-hang?user=" + uid));
            const data = await res.json();
            const list = document.getElementById("checkout-order-list");
            
            if (!data.status || !data.data || data.data.length === 0) {
                if(list) list.innerHTML = "<p>Giỏ hàng trống</p>"; 
                return;
            }

            let html = ""; let subtotal = 0; let count = 0;
            data.data.forEach(item => {
                const price = parseInt(item.GiaBan || item.Gia || 0);
                const qty = parseInt(item.SoLuong || 1);
                subtotal += price * qty;
                count += qty;
                
                let img = (item.AnhBia && item.AnhBia !== "null") ? item.AnhBia : "https://via.placeholder.com/80";
                if(!img.startsWith("http")) img = "../img/" + img;

                html += `
                <div class="co-item">
                    <img src="${img}" class="co-img">
                    <div class="co-info">
                        <div class="co-name">${item.TenSach}</div>
                        <div class="co-qty">x${qty}</div>
                    </div>
                    <div class="co-price">${formatMoney(price * qty)}</div>
                </div>`;
            });

            if(list) list.innerHTML = html;
            const totalItemsEl = document.getElementById("totalItemsCount");
            const subtotalEl = document.getElementById("checkout-subtotal");
            
            if(totalItemsEl) totalItemsEl.textContent = count;
            if(subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
            
            recalculateTotal(); 

        } catch (e) { console.error(e); }
    }

    function formatMoney(n) {
        return Math.round(Number(n)).toLocaleString("vi-VN") + "đ";
    }
});