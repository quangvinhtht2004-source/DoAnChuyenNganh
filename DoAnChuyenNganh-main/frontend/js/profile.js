document.addEventListener("DOMContentLoaded", () => {
            // Giả lập đăng nhập user từ SQL (cho mục đích test)
            const dbUser = {
                UserID: 14,
                HoTen: "Khách 1",
                Email: "KH1@gmail.com",
                SoDienThoai: "0707189144",
                VaiTro: "KhachHang"
            };

            // Nếu chưa có user trong localStorage thì set vào (để test)
            if(!localStorage.getItem("user")) {
                localStorage.setItem("user", JSON.stringify(dbUser));
            }

            // Load thông tin user hiện tại
            const userJson = localStorage.getItem("user");
            if (userJson) {
                const currentUser = JSON.parse(userJson);
                loadUserProfile(currentUser);
            }

            // Xử lý đăng xuất sidebar
            document.getElementById("logoutBtnSidebar").addEventListener("click", (e) => {
                e.preventDefault();
                localStorage.removeItem("user");
                alert("Đăng xuất thành công!");
                window.location.href = "index.html";
            });
        });

        function loadUserProfile(user) {
            // Sidebar
            const sidebarName = document.getElementById("sidebarName");
            if(sidebarName) sidebarName.textContent = user.HoTen;
            
            const sidebarAvatar = document.getElementById("sidebarAvatar");
            if(sidebarAvatar) {
                const avatarUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.HoTen) + "&background=FF6600&color=fff";
                sidebarAvatar.src = avatarUrl;
            }

            // Form Fields
            const elName = document.getElementById("fullname");
            const elEmail = document.getElementById("email");
            const elPhone = document.getElementById("phone");

            if(elName) elName.value = user.HoTen || "";
            if(elEmail) elEmail.value = user.Email || "";
            if(elPhone) elPhone.value = user.SoDienThoai || "";
        }

        function updateProfile() {
            const userJson = localStorage.getItem("user");
            if (!userJson) return;
            let user = JSON.parse(userJson);

            // Cập nhật dữ liệu mới
            const newName = document.getElementById("fullname").value.trim();
            const newPhone = document.getElementById("phone").value.trim();

            if (!newName || !newPhone) {
                alert("Họ tên và Số điện thoại không được để trống!");
                return;
            }

            const newData = {
                ...user,
                HoTen: newName,
                SoDienThoai: newPhone
            };

            localStorage.setItem("user", JSON.stringify(newData));
            alert("Cập nhật thông tin thành công!");
            location.reload(); 
        }