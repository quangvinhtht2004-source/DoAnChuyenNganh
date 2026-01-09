// js/admin-users.js

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
});

let allUsersData = []; 
const modal = document.getElementById("userModal");

// 1. Phân loại đơn giản: Admin, Staff, Member
function getUserGroup(dbRole) {
    if (!dbRole) return 'KhachHang';
    const r = String(dbRole).toLowerCase().trim();
    if (r === 'admin' || r === 'quantri' || r === '1') return 'Admin';
    if (r.includes('nhanvien') || r === 'staff' || r === '2') return 'NhanVien';
    return 'KhachHang';
}

// 2. Tải dữ liệu
async function loadUsers() {
    try {
        const res = await fetch(AppConfig.getUrl("user"));
        const data = await res.json();

        if (data.status && Array.isArray(data.data)) {
            allUsersData = data.data;
            const admins = allUsersData.filter(u => getUserGroup(u.VaiTro) === 'Admin');
            const staffs = allUsersData.filter(u => getUserGroup(u.VaiTro) === 'NhanVien');
            const members = allUsersData.filter(u => getUserGroup(u.VaiTro) === 'KhachHang');

            renderAdminTable(admins);
            renderStaffTable(staffs);
            renderMemberTable(members);
        }
    } catch (err) { console.error(err); }
}

// Render Admin
function renderAdminTable(list) {
    const tbody = document.getElementById("listAdmin");
    if(!tbody) return;
    tbody.innerHTML = list.length ? list.map(u => `
        <tr>
            <td style="font-weight:bold;">${u.HoTen || u.Username}</td>
            <td>${u.Email}</td>
            <td>${u.SoDienThoai || '---'}</td>
            <td style="text-align:center;"><span class="role-badge badge-admin">Chủ Cửa Hàng</span></td>
        </tr>`).join('') : `<tr><td colspan="4" style="text-align:center">Chưa có Admin</td></tr>`;
}

// Render Staff (Nhân viên Vận hành)
function renderStaffTable(list) {
    const tbody = document.getElementById("listStaff");
    if(!tbody) return;
    tbody.innerHTML = list.length ? list.map(u => {
        const uStr = JSON.stringify(u).replace(/"/g, '&quot;');
        return `
        <tr>
            <td style="font-weight:bold;">${u.HoTen || u.Username}</td>
            <td>${u.Email}</td>
            <td>${u.SoDienThoai || '-'}</td>
            <td style="text-align:center;">
                <span class="badge-ops">NV Vận Hành</span>
            </td>
            <td class="action-col">
                <button class="btn-icon btn-edit" onclick="openEditModal(${uStr})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon btn-delete" onclick="deleteUser(${u.UserID})"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('') : `<tr><td colspan="5" style="text-align:center;">Chưa có nhân viên</td></tr>`;
}

// Render Member
function renderMemberTable(list) {
    const tbody = document.getElementById("listMember");
    if(!tbody) return;
    tbody.innerHTML = list.length ? list.map(u => `
        <tr>
            <td style="font-weight:bold;">${u.HoTen || u.Username}</td>
            <td>${u.Email}</td>
            <td>${u.SoDienThoai || '-'}</td>
            <td class="action-col">
                <button class="btn-icon btn-delete" onclick="deleteUser(${u.UserID})"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`).join('') : `<tr><td colspan="4" style="text-align:center;">Chưa có khách hàng</td></tr>`;
}

// --- LOGIC MODAL ---
window.openAddModal = function() {
    document.getElementById("modalTitle").innerText = "Thêm Nhân Viên Vận Hành";
    document.getElementById("userId").value = ""; 
    document.getElementById("userForm").reset();
    
    // Mặc định luôn là NhanVien
    document.getElementById("userRole").value = "NhanVien"; 
    
    document.getElementById("passGroup").style.display = "block";
    document.getElementById("passNote").style.display = "none";
    modal.classList.add("show");
}

window.openEditModal = function(user) {
    document.getElementById("modalTitle").innerText = "Cập nhật: " + (user.HoTen || "Nhân viên");
    document.getElementById("userId").value = user.UserID;
    document.getElementById("userName").value = user.HoTen || "";
    document.getElementById("userEmail").value = user.Email || "";
    document.getElementById("userPhone").value = user.SoDienThoai || "";
    
    // Giữ nguyên role cũ hoặc set lại là NhanVien
    document.getElementById("userRole").value = "NhanVien";

    document.getElementById("passGroup").style.display = "block"; 
    document.getElementById("userPass").value = ""; 
    document.getElementById("passNote").style.display = "block";
    modal.classList.add("show");
}

window.closeModal = function() { modal.classList.remove("show"); }

// --- LƯU DỮ LIỆU ---
window.saveUser = async function() {
    const id = document.getElementById("userId").value;
    const isEdit = id !== "";
    
    const payload = {
        HoTen: document.getElementById("userName").value.trim(),
        Email: document.getElementById("userEmail").value.trim(),
        SoDienThoai: document.getElementById("userPhone").value.trim(),
        VaiTro: document.getElementById("userRole").value // Luôn là 'NhanVien'
    };

    if (!payload.HoTen || !payload.Email) { alert("⚠️ Thiếu thông tin!"); return; }

    let url = isEdit ? AppConfig.getUrl("user/update") : AppConfig.getUrl("user/create");
    if(isEdit) payload.UserID = id;
    
    const pass = document.getElementById("userPass").value.trim();
    if(!isEdit && !pass) { alert("⚠️ Nhập mật khẩu!"); return; }
    if(pass) payload.MatKhau = pass;

    try {
        const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const result = await res.json();
        if(result.status) { alert("✅ Thành công!"); closeModal(); loadUsers(); }
        else { alert("❌ " + result.message); }
    } catch(e) { alert("Lỗi kết nối!"); }
}

window.deleteUser = async function(id) {
    if(!confirm("Xóa tài khoản này?")) return;
    try {
        const res = await fetch(AppConfig.getUrl("user/delete"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ UserID: id }) });
        const result = await res.json();
        if(result.status) { alert("✅ Đã xóa!"); loadUsers(); } else { alert("❌ " + result.message); }
    } catch(e) { alert("Lỗi kết nối!"); }
}