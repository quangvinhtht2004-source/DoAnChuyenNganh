// js/register.js

document.addEventListener("DOMContentLoaded", function() {
    
    // --- HÀM HỖ TRỢ ĐƯỜNG DẪN API ---
    function getApiUrl(endpoint) {
    return `http://127.0.0.1/WebsiteBanSach/backend/${endpoint}`;
}

    // --- 1. XỬ LÝ NÚT GỬI MÃ OTP ---
    const btnSendOTP = document.getElementById("btnSendOTP");
    const otpMsg = document.getElementById("otpMessage");
    let otpTimer = null; 

    if(btnSendOTP) {
        btnSendOTP.addEventListener("click", async function() {
            const emailInput = document.getElementById("email");
            const phoneInput = document.getElementById("phone");

            const email = emailInput.value.trim();
            const phone = phoneInput.value.trim();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            // Validate
            if (!email) { 
                alert("Vui lòng nhập Email để nhận mã OTP!"); 
                emailInput.focus();
                return; 
            }
            if (!emailRegex.test(email)) { 
                alert("Email không đúng định dạng!"); 
                emailInput.focus();
                return; 
            }

            if (!phone) {
                alert("Vui lòng nhập Số điện thoại để hệ thống kiểm tra!"); 
                phoneInput.focus(); 
                return;
            }

            // Hiệu ứng loading
            btnSendOTP.innerText = "Đang gửi...";
            btnSendOTP.disabled = true;
            btnSendOTP.style.opacity = "0.1";
            if(otpMsg) otpMsg.style.display = "none";

            try {
                const url = getApiUrl('auth/send-otp');
                console.log("Calling API:", url);

               
                const res = await fetch(url, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        Email: email ,
                        DienThoai: phone
                    }),
                    
                    
                    credentials: 'include' 
                });

                // Đọc text trước để bắt lỗi PHP Fatal Error
                const rawText = await res.text();
                let data;
                try {
                    data = JSON.parse(rawText);
                } catch (e) {
                    console.error("LỖI SERVER (HTML):", rawText);
                    throw new Error("Lỗi Server: " + rawText.substring(0, 100));
                }

                if (data.status) {
                   alert("✅ Thông tin hợp lệ! Mã OTP đã được gửi.");
                    
                    if(otpMsg) {
                        otpMsg.style.display = "block";
                        otpMsg.style.color = "green";
                        otpMsg.innerText = `Đã gửi mã tới ${email}. Hết hạn sau 2 phút.`;
                    }

                    // Đếm ngược 60s
                    startCountdown(60);
                } else {
                    alert("⚠️ " + data.message);
                    resetButton();
                }

            } catch (e) {
                console.error(e);
                alert("❌ Lỗi kết nối: " + e.message);
                resetButton();
            }
        });
    }
    function startCountdown(seconds) {
        let timeLeft = seconds;
        if (otpTimer) clearInterval(otpTimer);

        otpTimer = setInterval(() => {
            btnSendOTP.innerText = `Gửi lại (${timeLeft}s)`;
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(otpTimer);
                resetButton();
                btnSendOTP.innerText = "Lấy lại mã";
                if(otpMsg) {
                    otpMsg.style.color = "red";
                    otpMsg.innerText = "Mã OTP đã hết hạn. Vui lòng lấy mã mới.";
                }
            }
        }, 1000);
    }
    function resetButton() {
        btnSendOTP.disabled = false;
        btnSendOTP.style.opacity = "1";
        if(btnSendOTP.innerText.includes("Gửi lại") || btnSendOTP.innerText.includes("Đang")) {
            btnSendOTP.innerText = "Lấy mã";
        }
    }

    // --- 2. XỬ LÝ ĐĂNG KÝ ---
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            // A. Lấy dữ liệu
            const terms = document.getElementById("terms");
            const fullName = document.getElementById("fullName").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            const otpInput = document.getElementById("otpInput");
            const otp = otpInput ? otpInput.value.trim() : "";
            const phone = document.getElementById("phone").value.trim().replace(/\s/g, ''); 

            // B. Validation
            if (terms && !terms.checked) { alert("Bạn cần đồng ý với Điều khoản!"); return; }
            if (!fullName || !email || !phone || !password) { alert("Vui lòng nhập đầy đủ thông tin!"); return; }
            if (!otp) { 
                alert("Vui lòng nhập mã OTP đã gửi về mail!"); 
                if(otpInput) otpInput.focus();
                return; 
            }

            const btnSubmit = document.getElementById("btnSubmit");
            const originalText = btnSubmit.innerText;
            btnSubmit.innerText = "Đang xử lý...";
            btnSubmit.disabled = true;

            // Payload gửi đi: Key phải khớp với AuthController::register()
            const payload = {
                HoTen: fullName,
                Email: email,
                DienThoai: phone,
                MatKhau: password,
                otp: otp
            };

            try {
                const url = getApiUrl('auth/register');
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include' // <--- QUAN TRỌNG: Gửi kèm Session ID chứa OTP
                });

                const rawText = await res.text();
                let result;
                try {
                    result = JSON.parse(rawText);
                } catch(err) {
                     throw new Error("Lỗi Server: " + rawText.substring(0, 150));
                }

                if (result.status) {
                    alert("🎉 Đăng ký thành công! Bạn có thể đăng nhập ngay.");
                    window.location.href = "dangnhap.html";
                } else {
                    // Xử lý thông báo lỗi
                    // Sửa nhẹ: Ưu tiên hiển thị lỗi gốc từ server trước để dễ debug
                    let msg = result.message || "Đăng ký thất bại";
                    
                    // Nếu cần việt hóa đè lên thì bỏ comment đoạn dưới, nhưng cẩn thận nó che mất lỗi thật
                    /*
                    let lowerMsg = msg.toLowerCase();
                    if (lowerMsg.includes("otp")) msg = "Mã OTP không chính xác hoặc đã hết hạn!";
                    else if (lowerMsg.includes("email")) msg = "Email này đã được sử dụng!";
                    */
                    
                    alert("⚠️ " + msg);
                }

            } catch (error) {
                console.error(error);
                alert("❌ " + error.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerText = originalText;
            }
        });
    }

    // 3. TOGGLE MẬT KHẨU (Giữ nguyên)
    const toggleBtn = document.getElementById("togglePasswordRegister");
    const passInput = document.getElementById("password");
    
    if(toggleBtn && passInput) {
        toggleBtn.addEventListener("click", function() {
            const type = passInput.getAttribute("type") === "password" ? "text" : "password";
            passInput.setAttribute("type", type);
            
            const icon = this.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }
});