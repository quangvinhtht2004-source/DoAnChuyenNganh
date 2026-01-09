// js/admin-tacgia.js

let allData = [];

document.addEventListener("DOMContentLoaded", async () => {
    loadData();
    
    // Tìm kiếm
    const searchInput = document.getElementById("searchInput");
    if(searchInput) {
        searchInput.addEventListener("input", function() {
            const keyword = this.value.toLowerCase().trim();
            if (!keyword) {
                renderTable(allData);
                return;
            }
            const filtered = allData.filter(item => 
                item.TenTacGia.toLowerCase().includes(keyword)
            );
            renderTable(filtered);
        });
    }
});

// 1. TẢI DỮ LIỆU
async function loadData() {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">⏳ Đang tải...</td></tr>`;

    try {
        const res = await fetch(AppConfig.getUrl('tacgia')); 
        const result = await res.json();
        
        if (result.status) {
            allData = result.data || [];
            // Sắp xếp ID giảm dần để thấy mới nhất
            allData.sort((a, b) => a.TacGiaID - b.TacGiaID);
            renderTable(allData);
        } else {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Không có dữ liệu</td></tr>`;
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:red">Lỗi kết nối máy chủ</td></tr>`;
    }
}

// 2. HIỂN THỊ BẢNG
function renderTable(list) {
    const tbody = document.getElementById("tableBody");
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Không tìm thấy tác giả nào</td></tr>`;
        return;
    }

    let html = '';
    list.forEach(item => {
        html += `
            <tr>
                <td style="text-align:center;">#${item.TacGiaID}</td>
                <td style="font-weight:600;">${item.TenTacGia}</td>
                <td class="action-col" style="text-align:center;">
                    <button class="btn-icon btn-edit" title="Sửa" onclick="openModal(${item.TacGiaID}, '${item.TenTacGia}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-icon btn-delete" title="Xóa" onclick="deleteItem(${item.TacGiaID})">
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
    
    document.getElementById('modalTitle').innerText = id ? "Sửa Tác giả" : "Thêm Tác giả Mới";
    
    // Reset form value
    form.querySelector('[name="TacGiaID"]').value = id || '';
    form.querySelector('[name="TenTacGia"]').value = name;
    
    // Clear error states if any
    form.querySelector('[name="TenTacGia"]').style.borderColor = "#ddd";

    modal.classList.add('show');
    // Focus vào ô nhập liệu
    setTimeout(() => form.querySelector('[name="TenTacGia"]').focus(), 100);
}

// 4. LƯU DỮ LIỆU
window.saveData = async function() {
    const form = document.getElementById('dataForm');
    const id = form.querySelector('[name="TacGiaID"]').value;
    const nameInput = form.querySelector('[name="TenTacGia"]');
    const name = nameInput.value.trim();
    
    if(!name) { 
        alert("Vui lòng nhập tên tác giả!"); 
        nameInput.focus();
        return; 
    }

    const payload = { TenTacGia: name };
    if(id) payload.TacGiaID = id;

    const url = id ? AppConfig.getUrl('tacgia/sua') : AppConfig.getUrl('tacgia/tao');

    // Disable nút lưu để tránh click đúp
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
            loadData(); // Tải lại bảng
        } else { 
            // Hiển thị lỗi từ Backend (ví dụ: Tên đã trùng)
            alert("⚠️ " + result.message); 
            nameInput.style.borderColor = "red";
            nameInput.focus();
        }
    } catch(e) { 
        alert("Lỗi kết nối mạng hoặc lỗi server!");
        console.error(e);
    } finally {
        // Mở lại nút lưu
        btnSave.innerText = originalText;
        btnSave.disabled = false;
    }
}

// 5. XÓA
window.deleteItem = async function(id) {
    if(!confirm("Bạn có chắc muốn xóa tác giả này?\nLƯU Ý: Các sách thuộc tác giả này sẽ bị mất thông tin tác giả.")) return;
    
    try {
        const res = await fetch(AppConfig.getUrl('tacgia/xoa'), {
            method: 'POST', 
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ TacGiaID: id })
        });
        const result = await res.json();
        
        if(result.status) { 
            alert("✅ Đã xóa thành công!"); 
            loadData(); 
        } else { 
            alert("⚠️ " + result.message); 
        }
    } catch(e) { 
        alert("Lỗi mạng khi xóa!"); 
    }
}

window.closeModal = () => document.getElementById('editModal').classList.remove('show');