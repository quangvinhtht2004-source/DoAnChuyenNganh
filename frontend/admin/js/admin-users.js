document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
});

let allUsersData = []; 

// =======================================================
// 1. CHUẨN HÓA VAI TRÒ
// =======================================================
function getStandardRole(dbRole) {
    if (!dbRole) return 'KhachHang';
    const r = String(dbRole).toLowerCase().trim();
    if (r === 'admin' || r === 'quantri' || r === '1') return 'Admin';
    if (r === 'nhanvien' || r === 'staff' || r === '2') return 'NhanVien';
    return 'KhachHang';
}

// =======================================================
// 2. TẢI DỮ LIỆU & PHÂN CHIA
// =======================================================
async function loadUsers() {
    try {
        const res = await fetch(AppConfig.getUrl("user"));
        const data = await res.json();

        if (data.status && Array.isArray(data.data)) {
            allUsersData = data.data;
            
            // Lọc ra 3 nhóm
            const admins = allUsersData.filter(u => getStandardRole(u.VaiTro) === 'Admin');
            const staffs = allUsersData.filter(u => getStandardRole(u.VaiTro) === 'NhanVien');
            const members = allUsersData.filter(u => getStandardRole(u.VaiTro) === 'KhachHang');

            // Render từng nhóm với quyền hạn khác nhau
            renderAdminTable(admins);
            renderStaffTable(staffs);
            renderMemberTable(members);
        }
    } catch (err) {
        console.error("Lỗi tải user:", err);
    }
}

// --- Render Bảng Admin (Chỉ xem, không thao tác) ---
function renderAdminTable(list) {
    const tbody = document.getElementById("listAdmin");
    tbody.innerHTML = list.map(u => `
        <tr>
            <td style="font-weight:bold;">${u.HoTen || u.Username}</td>
            <td>${u.Email}</td>
            <td>${u.SoDienThoai || '0123456789'}</td>
            <td style="text-align:center;"><span class="role-badge badge-admin">Admin</span></td>
        </tr>
    `).join('');
}

// --- Render Bảng Nhân Viên (Sửa, Xóa) ---
function renderStaffTable(list) {
    const tbody = document.getElementById("listStaff");
    if(list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Chưa có nhân viên</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(u => {
        const uStr = JSON.stringify(u).replace(/"/g, '&quot;');
        return `
        <tr>
            <td style="font-weight:bold;">${u.HoTen || u.Username}</td>
            <td>${u.Email}</td>
            <td>${u.SoDienThoai || '-'}</td>
            <td style="text-align:center;"><span class="role-badge badge-staff">Staff</span></td>
            <td class="action-col">
                <button class="btn-icon btn-edit" title="Sửa" onclick="openEditModal(${uStr})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-icon btn-delete" title="Xóa" onclick="deleteUser(${u.UserID})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

// --- Render Bảng Khách Hàng (Chỉ Xóa) ---
function renderMemberTable(list) {
    const tbody = document.getElementById("listMember");
    if(list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Chưa có khách hàng</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(u => `
        <tr>
            <td style="font-weight:bold;">${u.HoTen || u.Username}</td>
            <td>${u.Email}</td>
            <td>${u.SoDienThoai || '-'}</td>
            <td>${u.DiaChi || 'Chưa cập nhật'}</td>
            <td class="action-col">
                <button class="btn-icon btn-delete" title="Xóa" onclick="deleteUser(${u.UserID})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// =======================================================
// 3. CÁC HÀM THAO TÁC (Thêm, Sửa, Xóa)
// =======================================================
const modal = document.getElementById("userModal");

// Mở modal Thêm mới (Chỉ thêm Nhân viên)
window.openAddModal = function() {
    document.getElementById("modalTitle").innerText = "Thêm Nhân Viên";
    document.getElementById("userId").value = ""; // Rỗng = Thêm mới
    document.getElementById("userForm").reset();
    document.getElementById("passGroup").style.display = "block"; // Hiện ô pass
    modal.classList.add("show");
}

// Mở modal Sửa (Chỉ sửa Nhân viên)
window.openEditModal = function(user) {
    document.getElementById("modalTitle").innerText = "Cập nhật Nhân Viên";
    document.getElementById("userId").value = user.UserID;
    document.getElementById("userName").value = user.HoTen || "";
    document.getElementById("userEmail").value = user.Email || "";
    document.getElementById("userPhone").value = user.SoDienThoai || "";
    
    // Ẩn ô mật khẩu khi sửa (nếu không muốn đổi pass)
    document.getElementById("passGroup").style.display = "none";
    document.getElementById("userPass").value = ""; 
    
    modal.classList.add("show");
}

window.closeModal = function() {
    modal.classList.remove("show");
}

// Xử lý Lưu (Create hoặc Update)
window.saveUser = async function() {
    const id = document.getElementById("userId").value;
    const isEdit = id !== "";
    
    const payload = {
        HoTen: document.getElementById("userName").value.trim(),
        Email: document.getElementById("userEmail").value.trim(),
        SoDienThoai: document.getElementById("userPhone").value.trim(),
        VaiTro: 'NhanVien' // Mặc định form này chỉ xử lý nhân viên
    };

    // Validate
    if (!payload.HoTen || !payload.Email) {
        alert("Vui lòng nhập tên và email!");
        return;
    }

    let url = "";
    
    if (isEdit) {
        // --- SỬA NHÂN VIÊN ---
        url = AppConfig.getUrl("user/update"); // Cần đảm bảo API có endpoint này hoặc dùng chung
        // Backend có thể yêu cầu UserID trong body
        payload.UserID = id;
        
        // Nếu API update của bạn là chung, hãy chắc chắn UserController hỗ trợ update
        // Nếu không có API update riêng, bạn có thể cần bổ sung vào UserController.php
    } else {
        // --- THÊM NHÂN VIÊN ---
        url = AppConfig.getUrl("user/create");
        const pass = document.getElementById("userPass").value.trim();
        if (!pass) { alert("Vui lòng nhập mật khẩu!"); return; }
        payload.MatKhau = pass;
    }

    // Gửi API (Giả sử bạn dùng user/create cho thêm và user/update cho sửa)
    // Lưu ý: Nếu bạn chưa có API update user, bạn cần viết thêm trong PHP.
    // Ở đây tôi dùng tạm logic gọi API create cho thêm.
    
    try {
        // Logic gửi API
        // Nếu là Sửa mà chưa có API update, code sẽ lỗi. Bạn cần bổ sung backend.
        // Tạm thời demo cho phần Thêm:
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        
        if(result.status) {
            alert(isEdit ? "Cập nhật thành công!" : "Thêm nhân viên thành công!");
            closeModal();
            loadUsers();
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch(e) {
        console.error(e);
        // Fallback alert nếu API chưa có
        if(isEdit) alert("Chức năng cập nhật cần API backend hỗ trợ!");
        else alert("Lỗi kết nối!");
    }
}

// Xóa User (Dùng chung cho Nhân viên và Khách hàng)
window.deleteUser = async function(id) {
    if(!confirm("Bạn có chắc chắn muốn xóa tài khoản này? Hành động không thể hoàn tác.")) return;

    try {
        // Gọi API xóa user (Giả sử API là user/delete hoặc giống logic xóa sách)
        // Bạn cần check file api.php xem đường dẫn xóa user là gì.
        // Nếu chưa có, tôi giả định là 'user/delete'
        const url = AppConfig.getUrl("user/delete"); 
        
        // Nếu api.php chưa có route này, bạn phải thêm vào: 
        // $router->post('user/delete', 'UserController@delete');

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ UserID: id })
        });
        const result = await res.json();
        
        if(result.status) {
            alert("Đã xóa thành công!");
            loadUsers();
        } else {
            alert("Không thể xóa: " + result.message);
        }
    } catch(e) {
        console.error(e);
        alert("Lỗi khi gọi API xóa (Kiểm tra xem Backend đã có hàm delete chưa)");
    }
}