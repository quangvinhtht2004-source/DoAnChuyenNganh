// js/admin-sach.js - FIXED IMAGE PATH

// 1. CẤU HÌNH ĐƯỜNG DẪN ẢNH
// Dựa vào hình folder của bạn, ảnh nằm ở frontend/img
const IMAGE_BASE_URL = '../../img/'; 

// ⚠️ QUAN TRỌNG: Trong folder của bạn KHÔNG có file VKD.png. 
// Mình đổi tạm thành '10nguoi.jpg' (có trong hình bạn gửi) để test code không bị lỗi đỏ.
// Bạn nên copy một file logo vào folder img và đổi tên thành 'default.png' sau nhé.
const DEFAULT_IMAGE_URL = '../../img/10nguoi.jpg'; 

let allBooksData = []; 
let g_Authors = {};
let g_Categories = {};
let g_Publishers = {};
let searchTimeout = null; 

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 DOM Loaded");
    await loadMetadata();
    loadBooks();

    const searchInput = document.getElementById("searchBook");
    if (searchInput) {
        searchInput.addEventListener("input", applyFilter);
    }
});

// 1. TẢI DỮ LIỆU
// 1. TẢI DỮ LIỆU (ĐÃ SỬA LỖI TREO LOADING)
async function loadBooks() {
    try {
        // Thêm loading indicator nếu cần (tùy chọn)
        const tableBody = document.getElementById("tableBodySach");
        if(tableBody) tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;">⏳ Đang tải dữ liệu...</td></tr>`;

        const res = await fetch(AppConfig.getUrl('sach'));
        const result = await res.json();
        
        // SỬA: Dù status là true hay false, ta vẫn xử lý để không bị treo
        if (result.status) {
            allBooksData = result.data || []; // Đảm bảo luôn là mảng
        } else {
            console.warn("API trả về false:", result.message);
            allBooksData = []; // Nếu lỗi thì coi như không có dữ liệu
        }

        // Luôn gọi renderTable để cập nhật giao diện (xóa chữ Đang tải...)
        renderTable(allBooksData);
        
    } catch (error) {
        console.error("Lỗi tải sách:", error);
        const tableBody = document.getElementById("tableBodySach");
        // Hiển thị lỗi rõ ràng ra màn hình
        if(tableBody) tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:red">❌ Lỗi kết nối: ${error.message}</td></tr>`;
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

// 3. HIỂN THỊ BẢNG (ĐÃ SỬA LỖI ĐƯỜNG DẪN ẢNH)
function renderTable(list) {
    const tableBody = document.getElementById("tableBodySach");
    if (!tableBody) return;
    
    let newHTML = "";

    if (list.length === 0) {
        newHTML = `<tr><td colspan="10" style="text-align:center;">Không tìm thấy kết quả</td></tr>`;
    } else {
        list.forEach(item => {
            // --- XỬ LÝ ĐƯỜNG DẪN ẢNH KỸ LƯỠNG ---
            let imgSrc = DEFAULT_IMAGE_URL; // Mặc định dùng ảnh thay thế trước
            
            if (item.AnhBia && item.AnhBia !== "null" && item.AnhBia.trim() !== "") {
                // Nếu là link online (http...) thì giữ nguyên
                if (item.AnhBia.startsWith('http')) {
                    imgSrc = item.AnhBia;
                } else {
                    // Nếu là tên file (vd: dacnhantam.jpg), ghép với đường dẫn gốc
                    // Loại bỏ dấu / ở đầu tên file nếu lỡ có trong DB
                    let cleanName = item.AnhBia.startsWith('/') ? item.AnhBia.substring(1) : item.AnhBia;
                    imgSrc = IMAGE_BASE_URL + cleanName;
                }
            }
            // -------------------------------------

            const gia = new Intl.NumberFormat('vi-VN').format(item.Gia) + 'đ';
            
            let statusBadge = `<span class="status-badge status-completed">Đang bán</span>`;
            if(item.TrangThai == 0) statusBadge = `<span class="status-badge status-cancelled">Ngừng bán</span>`;
            if(item.TrangThai == 2) statusBadge = `<span class="status-badge status-pending">Hết hàng</span>`;

            const tacGia = g_Authors[item.TacGiaID] || '-';
            const theLoai = g_Categories[item.TheLoaiID] || '-';
            const nxb = g_Publishers[item.NhaXuatBanID] || '-';

            newHTML += `
                <tr>
                    <td>#${item.SachID}</td>
                    <td>
                        <img src="${imgSrc}" 
                             alt="${item.TenSach}"
                             style="width:40px;height:55px;object-fit:cover;border:1px solid #ddd;border-radius:4px;" 
                             onerror="this.onerror=null; this.src='${DEFAULT_IMAGE_URL}';">
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