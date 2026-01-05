let allData = [];

document.addEventListener("DOMContentLoaded", async () => {
    loadData();
    
    // Tìm kiếm
    document.getElementById("searchNXB").addEventListener("input", function() {
        const k = this.value.toLowerCase();
        const f = allData.filter(i => i.TenNhaXuatBan.toLowerCase().includes(k));
        renderTable(f);
    });
});

async function loadData() {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">⏳ Đang tải...</td></tr>`;

    try {
        const res = await fetch(AppConfig.getUrl('nhaxuatban'));
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

function renderTable(list) {
    const tbody = document.getElementById("tableBody");
    let html = '';
    
    list.forEach(item => {
        html += `
            <tr>
                <td>#${item.NhaXuatBanID}</td>
                <td style="font-weight:600;">${item.TenNhaXuatBan}</td>
                <td class="action-col">
                    <button class="btn-icon btn-edit" onclick="openModal(${item.NhaXuatBanID}, '${item.TenNhaXuatBan}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteItem(${item.NhaXuatBanID})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html || `<tr><td colspan="3" style="text-align:center;">Trống</td></tr>`;
}

window.openModal = function(id = null, name = '') {
    const modal = document.getElementById('editModal');
    const form = document.getElementById('dataForm');
    
    document.getElementById('modalTitle').innerText = id ? "Sửa NXB" : "Thêm NXB";
    form.querySelector('[name="NhaXuatBanID"]').value = id || '';
    form.querySelector('[name="TenNhaXuatBan"]').value = name;
    
    modal.classList.add('show');
}

window.saveData = async function() {
    const form = document.getElementById('dataForm');
    const id = form.querySelector('[name="NhaXuatBanID"]').value;
    const name = form.querySelector('[name="TenNhaXuatBan"]').value;
    
    if(!name.trim()) { alert("Vui lòng nhập tên!"); return; }

    const payload = { TenNhaXuatBan: name };
    if(id) payload.NhaXuatBanID = id;

    const url = id ? AppConfig.getUrl('nhaxuatban/sua') : AppConfig.getUrl('nhaxuatban/tao');

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

window.deleteItem = async function(id) {
    if(!confirm("Xóa Nhà xuất bản này?")) return;
    try {
        const res = await fetch(AppConfig.getUrl('nhaxuatban/xoa'), {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ NhaXuatBanID: id })
        });
        const result = await res.json();
        if(result.status) { alert("✅ Đã xóa!"); loadData(); }
        else { alert("⚠️ " + result.message); }
    } catch(e) { alert("Lỗi mạng"); }
}

window.closeModal = () => document.getElementById('editModal').classList.remove('show');