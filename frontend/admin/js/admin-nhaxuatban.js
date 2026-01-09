let allData = [];

document.addEventListener("DOMContentLoaded", async () => {
    loadData();
    
    // Tìm kiếm
    const searchInput = document.getElementById("searchNXB");
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            const k = this.value.toLowerCase().trim();
            if (!k) {
                renderTable(allData);
                return;
            }
            const f = allData.filter(i => i.TenNhaXuatBan.toLowerCase().includes(k));
            renderTable(f);
        });
    }
});

// 1. TẢI DỮ LIỆU
async function loadData() {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">⏳ Đang tải...</td></tr>`;

    try {
        const res = await fetch(AppConfig.getUrl('nhaxuatban'));
        const result = await res.json();
        
        if (result.status) {
            allData = result.data || [];
            
            // Sắp xếp ID tăng dần (Bé -> Lớn)
            allData.sort((a, b) => a.NhaXuatBanID - b.NhaXuatBanID);
            
            renderTable(allData);
        } else {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Không có dữ liệu</td></tr>`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:red">Lỗi kết nối</td></tr>`;
    }
}

// 2. RENDER BẢNG
function renderTable(list) {
    const tbody = document.getElementById("tableBody");
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Không tìm thấy kết quả</td></tr>`;
        return;
    }

    let html = '';
    list.forEach(item => {
        html += `
            <tr>
                <td style="text-align:center;">#${item.NhaXuatBanID}</td>
                <td style="font-weight:600;">${item.TenNhaXuatBan}</td>
                <td class="action-col" style="text-align:center;">
                    <button class="btn-icon btn-edit" title="Sửa" onclick="openModal(${item.NhaXuatBanID}, '${item.TenNhaXuatBan}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-icon btn-delete" title="Xóa" onclick="deleteItem(${item.NhaXuatBanID})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// 3. MỞ MODAL
window.openModal = function(id = null, name = '') {
    const modal = document.getElementById('editModal');
    const form = document.getElementById('dataForm');
    
    document.getElementById('modalTitle').innerText = id ? "Sửa NXB" : "Thêm NXB Mới";
    
    // Reset form
    form.querySelector('[name="NhaXuatBanID"]').value = id || '';
    form.querySelector('[name="TenNhaXuatBan"]').value = name;
    form.querySelector('[name="TenNhaXuatBan"]').style.borderColor = "#ddd"; // Reset màu lỗi

    modal.classList.add('show');
    setTimeout(() => form.querySelector('[name="TenNhaXuatBan"]').focus(), 100);
}

// 4. LƯU DỮ LIỆU
window.saveData = async function() {
    const form = document.getElementById('dataForm');
    const id = form.querySelector('[name="NhaXuatBanID"]').value;
    const nameInput = form.querySelector('[name="TenNhaXuatBan"]');
    const name = nameInput.value.trim();
    
    if(!name) { 
        alert("Vui lòng nhập tên nhà xuất bản!"); 
        nameInput.focus();
        return; 
    }

    const payload = { TenNhaXuatBan: name };
    if(id) payload.NhaXuatBanID = id;

    const url = id ? AppConfig.getUrl('nhaxuatban/sua') : AppConfig.getUrl('nhaxuatban/tao');

    // UX: Khóa nút khi đang lưu
    const btnSave = document.querySelector('.btn-save');
    const originalText = btnSave.innerText;
    btnSave.innerText = "Đang lưu...";
    btnSave.disabled = true;

    try {
        const res = await fetch(url, {
            method: 'POST', 
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        
        if(result.status) {
            alert("✅ " + result.message);
            closeModal();
            loadData();
        } else { 
            // HIỂN THỊ LỖI NẾU TRÙNG TÊN
            alert("⚠️ " + result.message); 
            nameInput.style.borderColor = "red";
            nameInput.focus();
        }
    } catch(e) { 
        alert("Lỗi kết nối!"); 
    } finally {
        btnSave.innerText = originalText;
        btnSave.disabled = false;
    }
}

// 5. XÓA
window.deleteItem = async function(id) {
    if(!confirm("Bạn có chắc muốn xóa NXB này?\nCác sách thuộc NXB này sẽ bị mất thông tin NXB.")) return;
    
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