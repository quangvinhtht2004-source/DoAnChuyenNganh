let allData = [];

document.addEventListener("DOMContentLoaded", async () => {
    loadData();
    
    // Tìm kiếm
    document.getElementById("searchTheLoai").addEventListener("input", function() {
        const k = this.value.toLowerCase();
        const f = allData.filter(i => i.TenTheLoai.toLowerCase().includes(k));
        renderTable(f);
    });
});

async function loadData() {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">⏳ Đang tải...</td></tr>`;

    try {
        const res = await fetch(AppConfig.getUrl('theloai'));
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
                <td>#${item.TheLoaiID}</td>
                <td style="font-weight:600;">${item.TenTheLoai}</td>
                <td class="action-col">
                    <button class="btn-icon btn-edit" onclick="openModal(${item.TheLoaiID}, '${item.TenTheLoai}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteItem(${item.TheLoaiID})">
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
    
    document.getElementById('modalTitle').innerText = id ? "Sửa Thể loại" : "Thêm Thể loại";
    form.querySelector('[name="TheLoaiID"]').value = id || '';
    form.querySelector('[name="TenTheLoai"]').value = name;
    
    modal.classList.add('show');
}

window.saveData = async function() {
    const form = document.getElementById('dataForm');
    const id = form.querySelector('[name="TheLoaiID"]').value;
    const name = form.querySelector('[name="TenTheLoai"]').value;
    
    if(!name.trim()) { alert("Vui lòng nhập tên!"); return; }

    const payload = { TenTheLoai: name };
    if(id) payload.TheLoaiID = id;

    const url = id ? AppConfig.getUrl('theloai/sua') : AppConfig.getUrl('theloai/tao');

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
    if(!confirm("Xóa thể loại này? Sách thuộc thể loại này có thể bị lỗi hiển thị.")) return;
    try {
        const res = await fetch(AppConfig.getUrl('theloai/xoa'), {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ TheLoaiID: id })
        });
        const result = await res.json();
        if(result.status) { alert("✅ Đã xóa!"); loadData(); }
        else { alert("⚠️ " + result.message); }
    } catch(e) { alert("Lỗi mạng"); }
}

window.closeModal = () => document.getElementById('editModal').classList.remove('show');