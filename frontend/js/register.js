// js/register.js

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. XỬ LÝ SUBMIT FORM
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            // --- A. LẤY DỮ LIỆU & CLEAN DATA ---
            const terms = document.getElementById("terms");
            const fullName = document.getElementById("fullName").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            
            // Xóa mọi khoảng trắng trong SĐT để tránh lỗi duplicate do format (VD: "090 123" vs "090123")
            let phone = document.getElementById("phone").value.trim().replace(/\s/g, ''); 

            // --- B. VALIDATION PHÍA CLIENT ---

            // 1. Kiểm tra điều khoản
            if (terms && !terms.checked) {
                alert("Bạn cần đồng ý với Điều khoản & Điều kiện!");
                return;
            }

            // 2. Kiểm tra dữ liệu trống
            if (!fullName || !email || !phone || !password) {
                alert("Vui lòng nhập đầy đủ thông tin!");
                return;
            }

            // 3. Validate Email (Regex chuẩn)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert("Địa chỉ Email không hợp lệ!");
                return;
            }

            // 4. Validate Số điện thoại VN (10 số, đầu 03, 05, 07, 08, 09)
            // Cập nhật Regex chặn số rác tốt hơn
            const phoneRegex = /^(0)(3[2-9]|5[2|6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
            if (!phoneRegex.test(phone)) {
                alert("Số điện thoại không hợp lệ! Vui lòng nhập đúng SĐT di động Việt Nam (10 số).");
                return;
            }

            // 5. Validate Mật khẩu
            if (password.length < 6) {
                alert("Mật khẩu phải có ít nhất 6 ký tự!");
                return;
            }

            // --- C. GỬI DỮ LIỆU ---
            const data = {
                HoTen: fullName,
                Email: email,
                DienThoai: phone, // Gửi số đã clean
                MatKhau: password,
                VaiTro: 'KhachHang', 
                SecretKey: "" 
            };

            try {
                // Hiệu ứng Loading nút bấm
                const btnSubmit = document.getElementById("btnSubmit");
                const originalText = btnSubmit.innerText;
                btnSubmit.innerText = "Đang xử lý...";
                btnSubmit.disabled = true;

                const url = AppConfig.getUrl('auth/register');
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const result = await res.json();

                // Reset nút bấm
                btnSubmit.innerText = originalText;
                btnSubmit.disabled = false;

                if (result.status) {
                    alert("Đăng ký thành công! Vui lòng đăng nhập.");
                    window.location.href = "dangnhap.html";
                } else {
                    // Xử lý thông báo lỗi trùng lặp từ Server trả về
                    let msg = result.message || "Đăng ký thất bại.";
                    const lowerMsg = msg.toLowerCase();

                    if (lowerMsg.includes("email")) {
                        msg = "Email này đã được sử dụng. Vui lòng chọn Email khác!";
                    } else if (lowerMsg.includes("phone") || lowerMsg.includes("điện thoại") || lowerMsg.includes("duplicate")) {
                        msg = "Số điện thoại này đã được đăng ký bởi tài khoản khác!";
                    }
                    
                    alert(msg);
                }

            } catch (error) {
                console.error(error);
                alert("Lỗi kết nối server. Vui lòng thử lại sau!");
                document.getElementById("btnSubmit").disabled = false;
                document.getElementById("btnSubmit").innerText = "Đăng ký tài khoản";
            }
        });
    }

    // 2. TOGGLE MẬT KHẨU
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