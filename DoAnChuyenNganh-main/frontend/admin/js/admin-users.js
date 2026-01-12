// js/admin-users.js

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
});

let allUsersData = []; 

// 1. Phân loại: Admin, Member
function getUserGroup(dbRole) {
    if (!dbRole) return 'KhachHang';
    const r = String(dbRole).toLowerCase().trim();
    if (r === 'admin' || r === 'quantri' || r === '1') return 'Admin';
    // Đã xóa check NhanVien vì không hiển thị
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
            // Bỏ lọc staff
            const members = allUsersData.filter(u => getUserGroup(u.VaiTro) === 'KhachHang');

            renderAdminTable(admins);
            // Bỏ renderStaffTable
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

// Đã xóa toàn bộ LOGIC MODAL (open, close, save)

window.deleteUser = async function(id) {
    if(!confirm("Xóa tài khoản này?")) return;
    try {
        const res = await fetch(AppConfig.getUrl("user/delete"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ UserID: id }) });
        const result = await res.json();
        if(result.status) { alert("✅ Đã xóa!"); loadUsers(); } else { alert("❌ " + result.message); }
    } catch(e) { alert("Lỗi kết nối!"); }
}