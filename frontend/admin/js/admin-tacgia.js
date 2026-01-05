// js/admin-tacgia.js

let allData = [];

document.addEventListener("DOMContentLoaded", async () => {
    loadData();
    // Tìm kiếm
    document.getElementById("searchInput").addEventListener("input", function() {
        const keyword = this.value.toLowerCase();
        const filtered = allData.filter(item => item.TenTacGia.toLowerCase().includes(keyword));
        renderTable(filtered);
    });
});

// 1. TẢI DỮ LIỆU
async function loadData() {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">⏳ Đang tải...</td></tr>`;

    try {
        const res = await fetch(AppConfig.getUrl('tacgia')); // Gọi API Tác giả
        const result = await res.json();
        
        if (result.status) {
            allData = result.data || [];
            renderTable(allData);
        } else {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Không có dữ liệu</td></tr>`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:red">Lỗi kết nối</td></tr>`;
    }
}

// 2. HIỂN THỊ BẢNG
function renderTable(list) {
    const tbody = document.getElementById("tableBody");
    let html = '';
    
    list.forEach(item => {
        html += `
            <tr>
                <td>#${item.TacGiaID}</td>
                <td style="font-weight:600;">${item.TenTacGia}</td>
                <td class="action-col">
                    <button class="btn-icon btn-edit" onclick="openModal(${item.TacGiaID}, '${item.TenTacGia}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteItem(${item.TacGiaID})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html || `<tr><td colspan="3" style="text-align:center;">Trống</td></tr>`;
}

// 3. MỞ MODAL
window.openModal = function(id = null, name = '') {
    const modal = document.getElementById('editModal');
    const form = document.getElementById('dataForm');
    
    document.getElementById('modalTitle').innerText = id ? "Sửa Tác giả" : "Thêm Tác giả";
    form.querySelector('[name="TacGiaID"]').value = id || '';
    form.querySelector('[name="TenTacGia"]').value = name;
    
    modal.classList.add('show');
}

// 4. LƯU DỮ LIỆU
window.saveData = async function() {
    const form = document.getElementById('dataForm');
    const id = form.querySelector('[name="TacGiaID"]').value;
    const name = form.querySelector('[name="TenTacGia"]').value;
    
    if(!name.trim()) { alert("Vui lòng nhập tên!"); return; }

    const payload = { TenTacGia: name };
    if(id) payload.TacGiaID = id;

    const url = id ? AppConfig.getUrl('tacgia/sua') : AppConfig.getUrl('tacgia/tao');

    try {
        const res = await fetch(url, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if(result.status) {
            alert("✅ Thành công!");
            closeModal();
            loadData();
        } else { alert("❌ " + result.message); }
    } catch(e) { alert("Lỗi mạng"); }
}

// 5. XÓA
window.deleteItem = async function(id) {
    if(!confirm("Bạn có chắc muốn xóa tác giả này?")) return;
    try {
        const res = await fetch(AppConfig.getUrl('tacgia/xoa'), {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ TacGiaID: id })
        });
        const result = await res.json();
        if(result.status) { alert("✅ Đã xóa!"); loadData(); }
        else { alert("⚠️ " + result.message); }
    } catch(e) { alert("Lỗi mạng"); }
}

window.closeModal = () => document.getElementById('editModal').classList.remove('show');