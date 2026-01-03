document.addEventListener("DOMContentLoaded", function() {

    // 1. XỬ LÝ SUBMIT FORM ĐĂNG NHẬP
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const email = document.getElementById("emailInput").value.trim();
            const password = document.getElementById("passInput").value.trim();

            if (!email || !password) {
                alert("Vui lòng nhập đầy đủ Tài khoản và Mật khẩu!");
                return;
            }

            const data = { Email: email, MatKhau: password };

            try {
                // Hiệu ứng loading
                const btnSubmit = loginForm.querySelector("button[type='submit']");
                const originalText = btnSubmit.innerText;
                btnSubmit.innerText = "Đang kiểm tra...";
                btnSubmit.disabled = true;

                // Kiểm tra AppConfig để lấy URL đúng
                const url = (typeof AppConfig !== 'undefined') ? AppConfig.getUrl('auth/login') : '/api/auth/login';
                
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const result = await res.json();
                
                btnSubmit.innerText = originalText;
                btnSubmit.disabled = false;

                if (result.status) {
                    const userInfo = result.data;
                    const role = userInfo.VaiTro; 

                    // Lưu thông tin user
                    localStorage.setItem("user", JSON.stringify(userInfo));
                    
                    if (role !== 'KhachHang') {
                        // Logic cho Admin/Nhân viên
                        alert(`Xin chào Quản trị viên: ${userInfo.HoTen || userInfo.Username}`);
                        localStorage.setItem("adminInfo", JSON.stringify(userInfo));
                        window.location.href = "../admin/html/dashboard.html";
                    } else {
                        // Logic cho Khách hàng
                        alert("Đăng nhập thành công!");
                        window.location.href = "index.html";
                    }

                } else {
                    // XỬ LÝ THÔNG BÁO LỖI
                    let msg = result.message || "";
                    
                    // Nếu server trả về "User not found" hoặc tương tự -> báo "Tài khoản không tồn tại"
                    if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("tồn tại")) {
                        alert("Tài khoản này không tồn tại!");
                    } 
                    // Nếu server trả về "Password incorrect" -> báo sai mật khẩu
                    else if (msg.toLowerCase().includes("pass") || msg.toLowerCase().includes("mật khẩu")) {
                        alert("Mật khẩu không chính xác!");
                    } 
                    // Lỗi mặc định
                    else {
                        alert(msg || "Tài khoản hoặc mật khẩu không đúng.");
                    }
                }
            } catch (error) {
                console.error(error);
                alert("Lỗi kết nối đến server. Vui lòng thử lại!");
                if(loginForm.querySelector("button[type='submit']")) {
                    loginForm.querySelector("button[type='submit']").disabled = false;
                }
            }
        });
    }

    // 2. TOGGLE ẨN/HIỆN MẬT KHẨU
    const toggleBtn = document.getElementById("togglePasswordLogin");
    const passInput = document.getElementById("passInput");
    
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