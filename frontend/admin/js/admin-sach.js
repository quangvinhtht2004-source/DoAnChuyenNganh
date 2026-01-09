// js/admin-sach.js

const IMAGE_BASE_URL = '../../img/'; 
const DEFAULT_IMAGE_URL = '../../img/10nguoi.jpg'; 

let allBooksData = []; 
let g_Authors = {};     
let g_Categories = {};  
let g_Publishers = {};  

let g_AuthorsMapName = {}; 
let searchTimeout = null; 

let currentPage = 1;
const rowsPerPage = 10; 
let currentDataList = []; 

document.addEventListener("DOMContentLoaded", async () => {
    await loadMetadata(); 
    loadBooks();          
    const searchInput = document.getElementById("searchBook");
    if (searchInput) {
        searchInput.addEventListener("input", applyFilter);
    }
});

// 1. TẢI DỮ LIỆU SÁCH
async function loadBooks() {
    const tableBody = document.getElementById("tableBodySach");
    try {
        if(tableBody) tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;">⏳ Đang tải dữ liệu...</td></tr>`;

        const res = await fetch(AppConfig.getUrl('sach'));
        const result = await res.json();
        
        allBooksData = result.status ? (result.data || []) : [];
        
        currentPage = 1;
        renderTable(allBooksData);
        
    } catch (error) {
        if(tableBody) tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:red">❌ Lỗi kết nối API</td></tr>`;
    }
}

// 2. TẢI METADATA
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
            let html = `<option value="">-- Chọn --</option>`;
            if (data.status && data.data) {
                data.data.forEach(i => {
                    mapObj[i[idKey]] = i[nameKey];
                    if(el) html += `<option value="${i[idKey]}">${i[nameKey]}</option>`;
                });
            }
            if(el) el.innerHTML = html;
        };

        const fillAuthorData = (data) => {
            const el = document.getElementById('listTacGia');
            let html = "";
            g_Authors = {};
            g_AuthorsMapName = {};

            if (data.status && data.data) {
                data.data.forEach(i => {
                    g_Authors[i.TacGiaID] = i.TenTacGia;
                    if (i.TenTacGia) {
                        let cleanName = i.TenTacGia.trim();
                        g_AuthorsMapName["NAME_" + cleanName.toLowerCase()] = i.TacGiaID;
                    }
                    if(el) html += `<option value="${i.TenTacGia}"></option>`;
                });
            }
            if(el) el.innerHTML = html;
        };

        fillAuthorData(jsonTG);
        fillSelect(jsonTL, 'selectTheLoai', g_Categories, 'TheLoaiID', 'TenTheLoai');
        fillSelect(jsonNXB, 'selectNXB', g_Publishers, 'NhaXuatBanID', 'TenNhaXuatBan');
    } catch (e) { console.error("Lỗi Metadata", e); }
}

// 3. RENDER TABLE
function renderTable(list) {
    currentDataList = list;
    const tableBody = document.getElementById("tableBodySach");
    const paginationEl = document.getElementById("pagination");
    if (!tableBody) return;
    
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageData = list.slice(startIndex, endIndex);

    let html = "";
    if (!pageData || pageData.length === 0) {
        html = `<tr><td colspan="10" style="text-align:center;">Không tìm thấy dữ liệu</td></tr>`;
        if(paginationEl) paginationEl.innerHTML = ""; 
    } else {
        pageData.forEach(item => {
            let imgSrc = DEFAULT_IMAGE_URL;
            if (item.AnhBia) {
                imgSrc = item.AnhBia.startsWith('http') ? item.AnhBia : IMAGE_BASE_URL + item.AnhBia;
            }
            
            let statusBadge = `<span class="status-badge status-completed">Đang bán</span>`;
            if(item.TrangThai == 0) statusBadge = `<span class="status-badge status-cancelled">Ngừng bán</span>`;
            if(item.TrangThai == 2) statusBadge = `<span class="status-badge status-pending">Hết hàng</span>`;

            html += `
                <tr>
                    <td>#${item.SachID}</td>
                    <td><img src="${imgSrc}" class="table-img-main" style="width:35px;height:50px;object-fit:cover;border:1px solid #ddd;border-radius:4px;"></td>
                    <td style="font-weight:600;" title="${item.TenSach}">${item.TenSach}</td>
                    <td>${g_Authors[item.TacGiaID] || '<i style="color:#999">Chưa rõ</i>'}</td>
                    <td>${g_Categories[item.TheLoaiID] || '---'}</td>
                    <td>${g_Publishers[item.NhaXuatBanID] || '---'}</td>
                    <td style="color:#d63031;font-weight:bold;">${new Intl.NumberFormat('vi-VN').format(item.Gia)}đ</td>
                    <td style="text-align:center;">${item.SoLuong}</td>
                    <td style="text-align:center;">${statusBadge}</td>
                    <td class="action-col">
                        <button class="btn-icon btn-edit" onclick="openModalSach(${item.SachID})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon btn-delete" onclick="deleteBook(${item.SachID})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
        });
        renderPagination(list.length);
    }
    tableBody.innerHTML = html;
}

// 3.1 PHÂN TRANG
function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const paginationEl = document.getElementById("pagination");
    if (!paginationEl) return;

    if (totalPages <= 1) {
        paginationEl.innerHTML = ""; 
        return;
    }

    let html = "";
    html += `<button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
             <i class="fa-solid fa-chevron-left"></i></button>`;
    html += `<button class="page-btn active" style="cursor: default; pointer-events: none;">${currentPage}</button>`;
    html += `<button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
             <i class="fa-solid fa-chevron-right"></i></button>`;
    paginationEl.innerHTML = html;
}

window.changePage = function(page) {
    const totalPages = Math.ceil(currentDataList.length / rowsPerPage);
    if (page < 1 || page > totalPages) return; 
    currentPage = page;
    renderTable(currentDataList); 
}

// 4. MODAL
window.openModalSach = function(sachId = null) {
    const modal = document.getElementById('editModalSach');
    const form = document.getElementById('formSach');
    if(!modal || !form) return;

    form.reset(); 
    
    // [CẬP NHẬT] Reset viền đỏ của input tên sách
    const nameInput = form.querySelector('[name="TenSach"]');
    if(nameInput) nameInput.style.borderColor = "#ddd";

    ['hiddenMain', 'hiddenSub1', 'hiddenSub2'].forEach(id => document.getElementById(id).value = "");
    ['previewMain', 'previewSub1', 'previewSub2'].forEach(id => {
        const box = document.getElementById(id);
        box.querySelector('img').style.display = 'none';
        box.querySelector('.img-placeholder').style.display = 'block';
    });

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
        
        document.getElementById('inputTacGia').value = g_Authors[item.TacGiaID] || "";
        form.querySelector('[name="TheLoaiID"]').value = item.TheLoaiID || "";
        form.querySelector('[name="NhaXuatBanID"]').value = item.NhaXuatBanID || "";
        
        if(item.AnhBia) {
            document.getElementById('hiddenMain').value = item.AnhBia;
            previewImage(item.AnhBia, 'previewMain');
        }
        if(item.AnhPhu1) {
            document.getElementById('hiddenSub1').value = item.AnhPhu1;
            previewImage(item.AnhPhu1, 'previewSub1');
        }
        if(item.AnhPhu2) {
            document.getElementById('hiddenSub2').value = item.AnhPhu2;
            previewImage(item.AnhPhu2, 'previewSub2');
        }

    } else {
        document.getElementById('modalTitleSach').innerText = "Thêm sách mới";
        form.querySelector('[name="SachID"]').value = "";
    }
    modal.classList.add('show'); 
    // Focus vào ô tên sách
    setTimeout(() => { if(nameInput) nameInput.focus(); }, 100);
}

// 5. XỬ LÝ FILE ẢNH
window.handleFileSelect = function(input, hiddenId, previewId) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        document.getElementById(hiddenId).value = file.name;

        const reader = new FileReader();
        reader.onload = function(e) {
            const box = document.getElementById(previewId);
            const img = box.querySelector('img');
            const ph = box.querySelector('.img-placeholder');
            img.src = e.target.result;
            img.style.display = 'block';
            ph.style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
}

// 6. LƯU DỮ LIỆU [CẬP NHẬT: CHECK TRÙNG TÊN]
window.saveDataSach = async function() {
    const form = document.getElementById('formSach');
    const formData = new FormData(form);
    const rawData = Object.fromEntries(formData.entries());
    const nameInput = form.querySelector('[name="TenSach"]');

    const soLuong = parseInt(rawData.SoLuong || 0);
    const giamGia = parseInt(rawData.PhanTramGiam || 0);
    const giaBan = parseFloat(rawData.Gia || 0);

    if (soLuong < 0 || giamGia >= 50 || giaBan <= 0) {
        alert("⚠️ Vui lòng kiểm tra lại giá trị (Giá > 0, Giảm giá < 50%)!"); return;
    }

    if (!rawData.TenSach.trim()) {
        alert("⚠️ Vui lòng nhập tên sách!");
        if(nameInput) nameInput.focus();
        return;
    }

    // --- LOGIC XỬ LÝ TÁC GIẢ ---
    const tenTacGia = document.getElementById('inputTacGia').value.trim();
    let tacGiaID = g_AuthorsMapName["NAME_" + tenTacGia.toLowerCase()] || null;

    if (!tacGiaID && tenTacGia !== "") {
        const confirmAdd = confirm(`Tác giả "${tenTacGia}" chưa có trong hệ thống.\nBạn có muốn thêm mới ngay không?`);
        if (confirmAdd) {
            try {
                const resTG = await fetch(AppConfig.getUrl('tacgia/tao'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ TenTacGia: tenTacGia })
                });
                const resultTG = await resTG.json();

                if (resultTG.status && resultTG.data && resultTG.data.TacGiaID) {
                    const newId = resultTG.data.TacGiaID;
                    tacGiaID = newId; 
                    g_Authors[newId] = tenTacGia;
                    g_AuthorsMapName["NAME_" + tenTacGia.toLowerCase()] = newId;
                } else {
                    alert("❌ Lỗi khi thêm tác giả: " + (resultTG.message || "Không lấy được ID"));
                    return; 
                }
            } catch (e) {
                alert("❌ Lỗi kết nối khi thêm tác giả!"); return;
            }
        } else {
            alert("⚠️ Vui lòng chọn một tác giả có sẵn!");
            return; 
        }
    }
    // ----------------------------

    const payload = {
        SachID: rawData.SachID ? parseInt(rawData.SachID) : null,
        TenSach: rawData.TenSach.trim(),
        Gia: giaBan,
        PhanTramGiam: giamGia,
        SoLuong: soLuong,
        TrangThai: parseInt(rawData.TrangThai),
        TacGiaID: tacGiaID,
        TheLoaiID: rawData.TheLoaiID,
        NhaXuatBanID: rawData.NhaXuatBanID,
        MoTa: rawData.MoTa,
        AnhBia: document.getElementById('hiddenMain').value,
        AnhPhu1: document.getElementById('hiddenSub1').value,
        AnhPhu2: document.getElementById('hiddenSub2').value
    };

    const url = payload.SachID ? AppConfig.getUrl('sach/sua') : AppConfig.getUrl('sach/tao');

    // UX: Hiển thị trạng thái đang lưu
    const btnSave = document.querySelector('.btn-save');
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...`;
    btnSave.disabled = true;

    try {
        const res = await fetch(url, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        
        if (result.status) {
            alert("✅ " + result.message);
            closeModal('editModalSach');
            loadBooks(); 
            loadMetadata(); 
        } else {
            // HIỂN THỊ LỖI NẾU TRÙNG TÊN SÁCH
            alert("⚠️ " + result.message);
            if (result.message.toLowerCase().includes("tên sách") && nameInput) {
                nameInput.style.borderColor = "red";
                nameInput.focus();
            }
        }
    } catch (e) { alert("Lỗi kết nối mạng"); }
    finally {
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
    }
}

window.deleteBook = async function(id) {
    if (!confirm("Bạn có chắc muốn xóa sách này?")) return;
    try {
        const res = await fetch(AppConfig.getUrl('sach/xoa'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ SachID: id })
        });
        const result = await res.json();
        if (result.status) { alert("✅ Đã xóa!"); loadBooks(); } 
        else { alert("⚠️ " + result.message); }
    } catch (e) { alert("Lỗi mạng!"); }
}

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

function applyFilter() {
    const keyword = document.getElementById("searchBook").value.toLowerCase().trim();
    
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
        // Nếu ô tìm kiếm trống -> hiển thị lại toàn bộ
        if (!keyword) { 
            currentPage = 1; 
            renderTable(allBooksData); 
            return; 
        }

        const filtered = allBooksData.filter(item => {
            // Lấy tên từ dữ liệu gốc hoặc map
            const bookName = item.TenSach.toLowerCase();
            const authorName = (g_Authors[item.TacGiaID] || "").toLowerCase();
            const categoryName = (g_Categories[item.TheLoaiID] || "").toLowerCase(); // Thêm Thể loại
            const publisherName = (g_Publishers[item.NhaXuatBanID] || "").toLowerCase(); // Thêm NXB

            // Kiểm tra từ khóa có xuất hiện trong bất kỳ trường nào không
            return bookName.includes(keyword) || 
                   authorName.includes(keyword) ||
                   categoryName.includes(keyword) ||
                   publisherName.includes(keyword);
        });

        currentPage = 1;
        renderTable(filtered);
    }, 300);
}