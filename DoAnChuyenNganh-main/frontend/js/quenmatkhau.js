// js/quenmatkhau.js

document.addEventListener("DOMContentLoaded", function() {

    // Hàm lấy URL API
    function getApiUrl(endpoint) {
        if (typeof AppConfig !== 'undefined' && AppConfig.getUrl) {
            return AppConfig.getUrl(endpoint);
        }
        return `http://localhost/WebsiteBanSach/backend/${endpoint}`;
    }

    const btnGetCode = document.getElementById('btnGetCode');
    const btnVerifyOtp = document.getElementById('btnVerifyOtp');
    const emailInput = document.getElementById('email');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');

    // --- 1. SỰ KIỆN: GỬI EMAIL LẤY OTP ---
    if (btnGetCode) {
        btnGetCode.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            if(!email) { alert("Vui lòng nhập Email!"); return; }

            // Hiệu ứng Loading
            const originalText = btnGetCode.innerText;
            btnGetCode.innerText = "Đang gửi...";
            btnGetCode.disabled = true;

            try {
                const res = await fetch(getApiUrl('auth/forgot-password'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Email: email }),
                    credentials: 'include' // Quan trọng
                });
                const data = await res.json();
                
                if (data.status) {
                    alert("✅ " + data.message);
                    // Hiện phần nhập OTP
                    step2.style.display = 'block';
                    emailInput.disabled = true; // Khóa không cho sửa email
                    btnGetCode.style.display = 'none'; // Ẩn nút lấy mã đi
                } else {
                    alert("⚠️ " + data.message);
                    btnGetCode.innerText = originalText;
                    btnGetCode.disabled = false;
                }
            } catch (e) { 
                console.error(e);
                alert("❌ Lỗi kết nối Server!"); 
                btnGetCode.innerText = originalText;
                btnGetCode.disabled = false;
            }
        });
    }

    // --- 2. SỰ KIỆN: XÁC THỰC OTP ---
    if (btnVerifyOtp) {
        btnVerifyOtp.addEventListener('click', async () => {
            const otp = document.getElementById('otpInput').value.trim();
            if(!otp) { alert("Vui lòng nhập OTP!"); return; }

            // Hiệu ứng Loading
            const originalText = btnVerifyOtp.innerText;
            btnVerifyOtp.innerText = "Đang kiểm tra...";
            btnVerifyOtp.disabled = true;

            try {
                const res = await fetch(getApiUrl('auth/verify-otp-reset'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ otp: otp }),
                    credentials: 'include' // Quan trọng
                });
                const data = await res.json();

                if (data.status) {
                    // Thành công -> Chuyển sang trang đặt mật khẩu mới
                    window.location.href = "matkhaumoi.html"; 
                } else {
                    alert("❌ " + data.message);
                    btnVerifyOtp.innerText = originalText;
                    btnVerifyOtp.disabled = false;
                }
            } catch (e) { 
                console.error(e);
                alert("❌ Lỗi kết nối Server!"); 
                btnVerifyOtp.innerText = originalText;
                btnVerifyOtp.disabled = false;
            }
        });
    }
});