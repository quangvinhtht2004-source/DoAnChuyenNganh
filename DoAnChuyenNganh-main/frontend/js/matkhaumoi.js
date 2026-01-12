// js/matkhaumoi.js

document.addEventListener("DOMContentLoaded", function() {

    function getApiUrl(endpoint) {
        if (typeof AppConfig !== 'undefined' && AppConfig.getUrl) {
            return AppConfig.getUrl(endpoint);
        }
        return `http://localhost/WebsiteBanSach/backend/${endpoint}`;
    }

    const resetForm = document.getElementById('resetForm');

    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newPass = document.getElementById('newPass').value.trim();
            const confirmPass = document.getElementById('confirmPass').value.trim();
            const btnSubmit = resetForm.querySelector('button[type="submit"]');

            // 1. Kiểm tra độ dài
            if (newPass.length < 6) {
                alert("⚠️ Mật khẩu phải có ít nhất 6 ký tự!");
                return;
            }

            // 2. Kiểm tra khớp mật khẩu
            if (newPass !== confirmPass) {
                alert("⚠️ Mật khẩu xác nhận không khớp!");
                return;
            }

            // Hiệu ứng loading
            const originalText = btnSubmit.innerText;
            btnSubmit.innerText = "Đang cập nhật...";
            btnSubmit.disabled = true;

            try {
                const res = await fetch(getApiUrl('auth/reset-password'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ MatKhauMoi: newPass }),
                    credentials: 'include' // Bắt buộc
                });
                const data = await res.json();

                if (data.status) {
                    alert("🎉 " + data.message);
                    window.location.href = "dangnhap.html";
                } else {
                    alert("❌ " + data.message);
                    btnSubmit.innerText = originalText;
                    btnSubmit.disabled = false;

                    // Nếu lỗi do hết session (chưa verify OTP), quay về trang đầu
                    if(data.message.toLowerCase().includes("chưa xác thực")) {
                        window.location.href = "quenmatkhau.html";
                    }
                }
            } catch (e) { 
                console.error(e);
                alert("❌ Lỗi kết nối Server!"); 
                btnSubmit.innerText = originalText;
                btnSubmit.disabled = false;
            }
        });
    }
});