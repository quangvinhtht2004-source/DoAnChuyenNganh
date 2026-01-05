document.addEventListener("DOMContentLoaded", function() {

    // 1. XỬ LÝ SUBMIT FORM ĐĂNG NHẬP
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            // Lấy giá trị input (Có thể là Email hoặc Họ Tên)
            const loginInput = document.getElementById("emailInput").value.trim();
            const password = document.getElementById("passInput").value.trim();

            if (!loginInput || !password) {
                alert("Vui lòng nhập đầy đủ Tài khoản và Mật khẩu!");
                return;
            }

            // Gửi key là 'TaiKhoan' thay vì 'Email' để backend xử lý đa năng
            const data = { TaiKhoan: loginInput, MatKhau: password };

            try {
                const btnSubmit = loginForm.querySelector("button[type='submit']");
                const originalText = btnSubmit.innerText;
                btnSubmit.innerText = "Đang kiểm tra...";
                btnSubmit.disabled = true;

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

                    localStorage.setItem("user", JSON.stringify(userInfo));
                    
                    if (role !== 'KhachHang') {
                        alert(`Xin chào Quản trị viên: ${userInfo.HoTen}`);
                        localStorage.setItem("adminInfo", JSON.stringify(userInfo));
                        window.location.href = "../admin/html/dashboard.html";
                    } else {
                        alert("Đăng nhập thành công!");
                        window.location.href = "index.html";
                    }

                } else {
                    let msg = result.message || "";
                    if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("tồn tại")) {
                        alert("Tài khoản (Email hoặc Tên) không tồn tại!");
                    } else if (msg.toLowerCase().includes("pass") || msg.toLowerCase().includes("mật khẩu")) {
                        alert("Mật khẩu không chính xác!");
                    } else {
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