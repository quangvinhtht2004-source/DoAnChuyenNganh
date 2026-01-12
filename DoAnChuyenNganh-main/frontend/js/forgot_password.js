document.addEventListener("DOMContentLoaded", function() {
    
    function getApiUrl(endpoint) {
        if (typeof AppConfig !== 'undefined' && AppConfig.getUrl) {
            return AppConfig.getUrl(endpoint);
        }
        return `http://localhost/WebsiteBanSach/backend/${endpoint}`;
    }

    const btnGetCode = document.getElementById("btnGetCode");
    const resetArea = document.getElementById("resetArea");
    const forgotForm = document.getElementById("forgotForm");
    const emailInput = document.getElementById("email");

    // 1. XỬ LÝ LẤY MÃ
    btnGetCode.addEventListener("click", async function() {
        const email = emailInput.value.trim();
        if(!email) { alert("Vui lòng nhập Email!"); return; }

        btnGetCode.innerText = "Đang gửi...";
        btnGetCode.disabled = true;

        try {
            const res = await fetch(getApiUrl('auth/forgot-password'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Email: email }),
                credentials: 'include' // Quan trọng để lưu Session
            });

            const data = await res.json();

            if (data.status) {
                alert("✅ " + data.message);
                // Hiện form nhập OTP và Pass mới
                resetArea.style.display = "block";
                emailInput.readOnly = true; // Khóa email lại
                btnGetCode.innerText = "Đã gửi";
            } else {
                alert("⚠️ " + data.message);
                btnGetCode.innerText = "Lấy mã";
                btnGetCode.disabled = false;
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối Server");
            btnGetCode.innerText = "Lấy mã";
            btnGetCode.disabled = false;
        }
    });

    // 2. XỬ LÝ ĐỔI MẬT KHẨU
    forgotForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const otp = document.getElementById("otp").value.trim();
        const newPass = document.getElementById("newPass").value.trim();

        if(!otp || !newPass) { alert("Vui lòng nhập đủ OTP và Mật khẩu mới!"); return; }

        try {
            const res = await fetch(getApiUrl('auth/reset-password'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp: otp, MatKhauMoi: newPass }),
                
                credentials: 'include'
            });

            const data = await res.json();

            if (data.status) {
                alert("🎉 " + data.message);
                window.location.href = "dangnhap.html";
            } else {
                alert("❌ " + data.message);
            }

        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối Server");
        }
    });
});