// js/register.js

document.addEventListener("DOMContentLoaded", function() {
    
    // BIẾN TOÀN CỤC
    let systemOTP = null;      // Lưu mã OTP hiện tại
    let otpTimer = null;       // Lưu bộ đếm giờ để có thể reset nếu cần

    // --- 1. XỬ LÝ NÚT GỬI OTP ---
    const btnSendOTP = document.getElementById("btnSendOTP");
    const emailInput = document.getElementById("email");
    const otpMsg = document.getElementById("otpMessage");

    if(btnSendOTP) {
        btnSendOTP.addEventListener("click", function() {
            const email = emailInput.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            // 1. Validate Email
            if (!email) {
                alert("Vui lòng nhập Email để nhận mã OTP!");
                emailInput.focus();
                return;
            }
            if (!emailRegex.test(email)) {
                alert("Email không hợp lệ!");
                emailInput.focus();
                return;
            }

            // 2. Tạo mã OTP ngẫu nhiên
            systemOTP = Math.floor(100000 + Math.random() * 900000).toString();
            console.log("System OTP:", systemOTP); // Log ra console để debug

            // 3. Thông báo cho người dùng (Giả lập đã gửi mail)
            // Lưu ý: Vì không gửi mail thật được nên mình hiển thị mã ở đây để bạn test
            alert(`Hệ thống đã gửi mã OTP đến email: ${email}\n\n(Mã dùng thử của bạn là: ${systemOTP})`);

            // 4. Xử lý giao diện & Đếm ngược 60s
            otpMsg.style.display = "block";
            otpMsg.style.color = "green";
            otpMsg.innerText = `Mã OTP đã được gửi. Vui lòng kiểm tra email.`;
            
            btnSendOTP.disabled = true; // Khóa nút không cho bấm liên tục
            let timeLeft = 60;

            // Xóa timer cũ nếu có
            if(otpTimer) clearInterval(otpTimer);

            // Bắt đầu đếm ngược
            otpTimer = setInterval(() => {
                btnSendOTP.innerText = `Gửi lại (${timeLeft}s)`;
                timeLeft--;

                // --- LOGIC HẾT HẠN (RESET) ---
                if (timeLeft < 0) {
                    clearInterval(otpTimer);           // Dừng đồng hồ
                    systemOTP = null;                  // Xóa mã OTP hệ thống (Hết hạn)
                    
                    btnSendOTP.disabled = false;       // Mở lại nút
                    btnSendOTP.innerText = "Lấy lại mã OTP";
                    
                    otpMsg.style.color = "red";
                    otpMsg.innerText = "Mã OTP đã hết hạn. Vui lòng lấy mã mới.";
                    alert("Mã OTP đã hết hạn! Vui lòng bấm gửi lại để lấy mã mới.");
                }
            }, 1000);
        });
    }

    // --- 2. XỬ LÝ SUBMIT FORM ĐĂNG KÝ ---
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            // --- A. LẤY DỮ LIỆU ---
            const terms = document.getElementById("terms");
            const fullName = document.getElementById("fullName").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            let phone = document.getElementById("phone").value.trim().replace(/\s/g, ''); 
            const userOtpInput = document.getElementById("otpInput").value.trim();

            // --- B. VALIDATION ---

            // 1. Kiểm tra OTP
            if (!systemOTP) {
                // Trường hợp chưa lấy mã HOẶC mã đã hết hạn (systemOTP bị set về null)
                alert("Vui lòng lấy mã OTP hoặc mã OTP đã hết hạn!");
                return;
            }
            
            if (!userOtpInput) {
                alert("Vui lòng nhập mã OTP!");
                document.getElementById("otpInput").focus();
                return;
            }

            if (userOtpInput !== systemOTP) {
                alert("Mã OTP không chính xác! Vui lòng kiểm tra lại.");
                return;
            }

            // 2. Các validation thông tin khác
            if (terms && !terms.checked) {
                alert("Bạn cần đồng ý với Điều khoản & Điều kiện!");
                return;
            }
            if (!fullName || !email || !phone || !password) {
                alert("Vui lòng nhập đầy đủ thông tin!");
                return;
            }
            const phoneRegex = /^(0)(3[2-9]|5[2|6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
            if (!phoneRegex.test(phone)) {
                alert("Số điện thoại không hợp lệ!");
                return;
            }
            if (password.length < 6) {
                alert("Mật khẩu phải có ít nhất 6 ký tự!");
                return;
            }

            // --- C. GỬI DỮ LIỆU (ĐĂNG KÝ THÀNH CÔNG) ---
            const data = {
                HoTen: fullName,
                Email: email,
                DienThoai: phone,
                MatKhau: password,
                VaiTro: 'KhachHang'
            };

            try {
                const btnSubmit = document.getElementById("btnSubmit");
                btnSubmit.innerText = "Đang xử lý...";
                btnSubmit.disabled = true;

                // Giả lập gọi API đăng ký
                setTimeout(() => {
                    // Lưu localstorage để demo
                    const newUser = {
                        UserID: Date.now(),
                        HoTen: fullName,
                        Email: email,
                        SoDienThoai: phone,
                        VaiTro: 'KhachHang',
                        DiaChi: ""
                    };
                    localStorage.setItem("user", JSON.stringify(newUser));

                    alert("Đăng ký tài khoản thành công!");
                    window.location.href = "profile.html"; 
                }, 1000);

            } catch (error) {
                console.error(error);
                alert("Lỗi hệ thống.");
                document.getElementById("btnSubmit").disabled = false;
            }
        });
    }

    // 3. TOGGLE MẬT KHẨU
    const toggleBtn = document.getElementById("togglePasswordRegister");
    const passInput = document.getElementById("password");
    if(toggleBtn && passInput) {
        toggleBtn.addEventListener("click", function() {
            const type = passInput.getAttribute("type") === "password" ? "text" : "password";
            passInput.setAttribute("type", type);
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
});