// js/admin-sach.js - OPTIMIZED FOR NO FLICKERING

const IMAGE_BASE_URL = '../../img/'; 
const DEFAULT_IMAGE_URL = '../../img/VKD.png';

let allBooksData = []; 
let g_Authors = {};
let g_Categories = {};
let g_Publishers = {};
let searchTimeout = null; // Biến dùng cho tính năng tìm kiếm không giật (debounce)

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 DOM Loaded");
    await loadMetadata();
    loadBooks();

    // Tìm kiếm (đã sửa để không bị lỗi nếu input chưa tồn tại)
    const searchInput = document.getElementById("searchBook");
    if (searchInput) {
        searchInput.addEventListener("input", applyFilter);
    }
});

// 1. TẢI DỮ LIỆU
async function loadBooks() {
    const tableBody = document.getElementById("tableBodySach");
    if (!tableBody) return;
    
    // --- KHẮC PHỤC GIẬT MÀN HÌNH ---
    // Chỉ hiện "Đang tải" nếu bảng đang hoàn toàn trống (lần đầu vào trang).
    // Nếu đang reload hoặc search, giữ nguyên dữ liệu cũ để người dùng không thấy bảng bị xóa trắng.
    if (tableBody.children.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;">⏳ Đang tải dữ liệu...</td></tr>`;
    }

    try {
        const res = await fetch(AppConfig.getUrl('sach'));
        const data = await res.json();
        
        if (data.status && Array.isArray(data.data)) {
            allBooksData = data.data;
            renderTable(allBooksData);
        } else {
            tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;">Không có dữ liệu</td></tr>`;
        }
    } catch (err) {
        console.error(err);
        // Chỉ hiện lỗi nếu chưa có dữ liệu nào
        if (tableBody.children.length <= 1) {
             tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:red;">Lỗi kết nối server</td></tr>`;
        }
    }
}

// 2. TẢI DANH MỤC CON (Tác giả, NXB...)
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

// 3. HIỂN THỊ BẢNG
function renderTable(list) {
    const tableBody = document.getElementById("tableBodySach");
    if (!tableBody) return;
    
    if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;">Không tìm thấy kết quả</td></tr>`;
        return;
    }

    let html = "";
    list.forEach(item => {
        let imgSrc = (item.AnhBia && item.AnhBia !== "null") ? item.AnhBia : DEFAULT_IMAGE_URL;
        if (!imgSrc.startsWith('http') && imgSrc !== DEFAULT_IMAGE_URL) imgSrc = IMAGE_BASE_URL + imgSrc;

        const gia = new Intl.NumberFormat('vi-VN').format(item.Gia) + 'đ';
        
        // Badge trạng thái
        let statusBadge = `<span class="status-badge status-completed">Đang bán</span>`;
        if(item.TrangThai == 0) statusBadge = `<span class="status-badge status-cancelled">Ngừng bán</span>`;
        if(item.TrangThai == 2) statusBadge = `<span class="status-badge status-pending">Hết hàng</span>`;

        html += `
            <tr>
                <td>#${item.SachID}</td>
                <td>
                    <img src="${imgSrc}" style="width:40px;height:55px;object-fit:cover;border:1px solid #ddd;border-radius:4px;" 
                         onerror="this.src='${DEFAULT_IMAGE_URL}'">
                </td>
                <td style="font-weight:600; white-space:normal;">${item.TenSach}</td>
                <td>${g_Authors[item.TacGiaID] || '-'}</td>
                <td>${g_Categories[item.TheLoaiID] || '-'}</td>
                <td>${g_Publishers[item.NhaXuatBanID] || '-'}</td>
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
    tableBody.innerHTML = html;
}

// 4. CHỨC NĂNG TÌM KIẾM (Đã thêm Debounce để không giật lag)
function applyFilter() {
    const searchInput = document.getElementById("searchBook");
    if (!searchInput) return;

    const keyword = searchInput.value.toLowerCase().trim();

    // Xóa lệnh cũ nếu người dùng gõ tiếp chưa quá 300ms
    clearTimeout(searchTimeout);

    // Đợi 300ms sau khi ngừng gõ mới render lại bảng
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

// 5. MỞ MODAL (THÊM / SỬA)
window.openModalSach = function(sachId = null) {
    const modal = document.getElementById('editModalSach');
    const form = document.getElementById('formSach');
    
    if(!modal || !form) return;

    form.reset(); // Xóa trắng form
    
    // Ẩn ảnh cũ để tránh nháy ảnh
    const imgPreview = document.getElementById('previewMain').querySelector('img');
    const imgPlace = document.getElementById('previewMain').querySelector('.img-placeholder');
    if(imgPreview) imgPreview.style.display = 'none';
    if(imgPlace) imgPlace.style.display = 'block';

    if (sachId) {
        // --- CHẾ ĐỘ SỬA ---
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
        // --- CHẾ ĐỘ THÊM ---
        document.getElementById('modalTitleSach').innerText = "Thêm sách mới";
        form.querySelector('[name="SachID"]').value = "";
    }

    modal.classList.add('show'); 
}

// 6. LƯU DỮ LIỆU
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

// 7. XÓA SÁCH
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

// HELPER
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
    } else {
        img.style.display = 'none';
        ph.style.display = 'block';
    }
}