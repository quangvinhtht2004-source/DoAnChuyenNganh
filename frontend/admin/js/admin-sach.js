// js/admin-sach.js - FIXED & OPTIMIZED

const IMAGE_BASE_URL = '../../img/'; 
const DEFAULT_IMAGE_URL = '../../img/VKD.png';

let allBooksData = []; 
let g_Authors = {};
let g_Categories = {};
let g_Publishers = {};
let searchTimeout = null; 

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 DOM Loaded");
    await loadMetadata();
    loadBooks();

    // SỬA LỖI 2: Bỏ logic setTimeout ở đây, chỉ gọi hàm applyFilter
    // Hàm applyFilter đã tự xử lý debounce (chống spam)
    const searchInput = document.getElementById("searchBook");
    if (searchInput) {
        searchInput.addEventListener("input", applyFilter);
    }
});

// 1. TẢI DỮ LIỆU
async function loadBooks() {
    try {
        const res = await fetch(AppConfig.getUrl('sach'));
        const result = await res.json();
        
        if (!result.status) return; 

        // SỬA LỖI 1: Cập nhật biến toàn cục để dùng cho tìm kiếm
        allBooksData = result.data; 

        // SỬA LỖI 3: Gọi renderTable thay vì tự vẽ HTML ở đây
        // Để tận dụng logic chống giật trong hàm renderTable
        renderTable(allBooksData);
        
    } catch (error) {
        console.error("Lỗi tải sách:", error);
        const tableBody = document.getElementById("tableBodySach");
        if(tableBody) tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:red">Lỗi kết nối!</td></tr>`;
    }
}

// 2. TẢI DANH MỤC CON
async function loadMetadata() {
    try {
        const [resTG, resTL, resNXB] = await Promise.all([
            fetch(AppConfig.getUrl('tacgia')),
            fetch(AppConfig.getUrl('theloai')),
            fetch(AppConfig.getUrl('nhaxuatban'))
        ]);
        
        const [jsonTG, jsonTL, jsonNXB] = await Promise.all([resTG.json(), resTL.json(), resNXB.json()]);

        const fillSelect = (data, elementId, mapObj, idKey, nameKey) => {
            const el = document.getElementById(elementId);
            if(!el) return;
            let html = `<option value="">-- Chọn --</option>`;
            if (data.status) {
                data.data.forEach(i => {
                    mapObj[i[idKey]] = i[nameKey];
                    html += `<option value="${i[idKey]}">${i[nameKey]}</option>`;
                });
            }
            el.innerHTML = html;
        };

        fillSelect(jsonTG, 'selectTacGia', g_Authors, 'TacGiaID', 'TenTacGia');
        fillSelect(jsonTL, 'selectTheLoai', g_Categories, 'TheLoaiID', 'TenTheLoai');
        fillSelect(jsonNXB, 'selectNXB', g_Publishers, 'NhaXuatBanID', 'TenNhaXuatBan');

    } catch (error) {
        console.error("Lỗi tải metadata:", error);
    }
}

// 3. HIỂN THỊ BẢNG (Đã tích hợp Anti-Flickering)
function renderTable(list) {
    const tableBody = document.getElementById("tableBodySach");
    if (!tableBody) return;
    
    // Tạo chuỗi HTML mới trong bộ nhớ
    let newHTML = "";

    if (list.length === 0) {
        newHTML = `<tr><td colspan="10" style="text-align:center;">Không tìm thấy kết quả</td></tr>`;
    } else {
        list.forEach(item => {
            let imgSrc = (item.AnhBia && item.AnhBia !== "null") ? item.AnhBia : DEFAULT_IMAGE_URL;
            if (!imgSrc.startsWith('http') && imgSrc !== DEFAULT_IMAGE_URL) imgSrc = IMAGE_BASE_URL + imgSrc;

            const gia = new Intl.NumberFormat('vi-VN').format(item.Gia) + 'đ';
            
            let statusBadge = `<span class="status-badge status-completed">Đang bán</span>`;
            if(item.TrangThai == 0) statusBadge = `<span class="status-badge status-cancelled">Ngừng bán</span>`;
            if(item.TrangThai == 2) statusBadge = `<span class="status-badge status-pending">Hết hàng</span>`;

            // Lấy tên từ ID (metadata)
            const tacGia = g_Authors[item.TacGiaID] || '-';
            const theLoai = g_Categories[item.TheLoaiID] || '-';
            const nxb = g_Publishers[item.NhaXuatBanID] || '-';

            newHTML += `
                <tr>
                    <td>#${item.SachID}</td>
                    <td>
                        <img src="${imgSrc}" style="width:40px;height:55px;object-fit:cover;border:1px solid #ddd;border-radius:4px;" 
                             onerror="this.src='${DEFAULT_IMAGE_URL}'">
                    </td>
                    <td style="font-weight:600; white-space:normal;">${item.TenSach}</td>
                    <td>${tacGia}</td>
                    <td>${theLoai}</td>
                    <td>${nxb}</td>
                    <td style="color:#d63031;font-weight:bold;">${gia}</td>
                    <td style="text-align:center;">${item.SoLuong}</td>
                    <td style="text-align:center;">${statusBadge}</td>
                    <td class="action-col">
                        <button class="btn-icon btn-edit" onclick="openModalSach(${item.SachID})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteBook(${item.SachID})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    // LOGIC CHỐNG GIẬT: Chỉ gán lại nếu HTML thực sự thay đổi
    if (tableBody.innerHTML !== newHTML) {
        tableBody.innerHTML = newHTML;
    }
}

// 4. CHỨC NĂNG TÌM KIẾM (Debounce chuẩn)
function applyFilter() {
    const searchInput = document.getElementById("searchBook");
    if (!searchInput) return;

    const keyword = searchInput.value.toLowerCase().trim();

    // Hủy lệnh cũ
    clearTimeout(searchTimeout);

    // Đợi 300ms sau khi ngừng gõ
    searchTimeout = setTimeout(() => {
        if (!keyword) {
            renderTable(allBooksData);
            return;
        }
        
        const filtered = allBooksData.filter(item => 
            (item.TenSach && item.TenSach.toLowerCase().includes(keyword)) || 
            (item.SachID && item.SachID.toString().includes(keyword))
        );

        renderTable(filtered);
    }, 300);
}

// 5. MỞ MODAL (GIỮ NGUYÊN)
window.openModalSach = function(sachId = null) {
    const modal = document.getElementById('editModalSach');
    const form = document.getElementById('formSach');
    
    if(!modal || !form) return;

    form.reset(); 
    
    const imgPreview = document.getElementById('previewMain').querySelector('img');
    const imgPlace = document.getElementById('previewMain').querySelector('.img-placeholder');
    if(imgPreview) { imgPreview.src=""; imgPreview.style.display = 'none'; }
    if(imgPlace) imgPlace.style.display = 'block';

    if (sachId) {
        const item = allBooksData.find(b => b.SachID == sachId);
        if(!item) return;

        document.getElementById('modalTitleSach').innerText = "Cập nhật sách #" + item.SachID;
        form.querySelector('[name="SachID"]').value = item.SachID;
        
        form.querySelector('[name="TenSach"]').value = item.TenSach;
        form.querySelector('[name="Gia"]').value = item.Gia; 
        form.querySelector('[name="PhanTramGiam"]').value = item.PhanTramGiam;
        form.querySelector('[name="SoLuong"]').value = item.SoLuong;
        form.querySelector('[name="TrangThai"]').value = item.TrangThai;
        form.querySelector('[name="MoTa"]').value = item.MoTa || "";
        
        form.querySelector('[name="TacGiaID"]').value = item.TacGiaID || "";
        form.querySelector('[name="TheLoaiID"]').value = item.TheLoaiID || "";
        form.querySelector('[name="NhaXuatBanID"]').value = item.NhaXuatBanID || "";
        
        if(item.AnhBia) {
            form.querySelector('[name="AnhBia"]').value = item.AnhBia;
            previewImage(item.AnhBia, 'previewMain');
        }

    } else {
        document.getElementById('modalTitleSach').innerText = "Thêm sách mới";
        form.querySelector('[name="SachID"]').value = "";
    }

    modal.classList.add('show'); 
}

// 6. LƯU DỮ LIỆU (GIỮ NGUYÊN)
window.saveDataSach = async function() {
    const form = document.getElementById('formSach');
    if (!form.checkValidity()) {
        form.reportValidity(); 
        return;
    }

    const formData = new FormData(form);
    const rawData = Object.fromEntries(formData.entries());

    const payload = {
        TenSach: rawData.TenSach,
        Gia: parseFloat(rawData.Gia),
        PhanTramGiam: parseInt(rawData.PhanTramGiam || 0),
        SoLuong: parseInt(rawData.SoLuong || 0),
        TrangThai: parseInt(rawData.TrangThai),
        AnhBia: rawData.AnhBia || "",
        MoTa: rawData.MoTa || "",
        TacGiaID: rawData.TacGiaID ? parseInt(rawData.TacGiaID) : null,
        TheLoaiID: rawData.TheLoaiID ? parseInt(rawData.TheLoaiID) : null,
        NhaXuatBanID: rawData.NhaXuatBanID ? parseInt(rawData.NhaXuatBanID) : null
    };

    const id = rawData.SachID;
    const url = id ? AppConfig.getUrl('sach/sua') : AppConfig.getUrl('sach/tao');
    
    if(id) payload.SachID = parseInt(id);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        
        if (result.status) {
            alert("✅ Thành công!");
            closeModal('editModalSach');
            loadBooks();
        } else {
            alert("❌ Lỗi: " + result.message);
        }
    } catch (e) {
        alert("Lỗi kết nối: " + e.message);
    }
}

// 7. XÓA SÁCH (GIỮ NGUYÊN)
window.deleteBook = async function(id) {
    if (!confirm("Bạn có chắc muốn xóa sách này?")) return;
    
    try {
        const res = await fetch(AppConfig.getUrl('sach/xoa'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ SachID: id })
        });
        
        const result = await res.json();
        if (result.status) {
            alert("✅ Đã xóa!");
            loadBooks();
        } else {
            alert("⚠️ " + result.message); 
        }
    } catch (e) {
        alert("Lỗi mạng!");
    }
}

// HELPER (GIỮ NGUYÊN)
window.closeModal = function(id) {
    const m = document.getElementById(id);
    if(m) m.classList.remove('show');
}

window.previewImage = function(val, targetId) {
    const box = document.getElementById(targetId);
    if(!box) return;
    const img = box.querySelector('img');
    const ph = box.querySelector('.img-placeholder');
    
    if(val && val.trim() !== "") {
        if(!val.startsWith('http')) val = IMAGE_BASE_URL + val;
        img.src = val;
        img.style.display = 'block';
        ph.style.display = 'none';
        
        // Thêm xử lý lỗi ảnh
        img.onerror = function() {
            img.style.display = 'none';
            ph.style.display = 'block';
        };
    } else {
        img.style.display = 'none';
        ph.style.display = 'block';
    }
}