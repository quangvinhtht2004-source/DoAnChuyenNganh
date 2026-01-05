// js/admin-sach.js - SEARCH UPGRADE & VALIDATION

// 1. CẤU HÌNH ĐƯỜNG DẪN ẢNH
const IMAGE_BASE_URL = '../../img/'; 
const DEFAULT_IMAGE_URL = '../../img/10nguoi.jpg'; 

// Biến toàn cục lưu dữ liệu
let allBooksData = []; 
// Các Map để tra cứu ID -> Tên (Dùng cho hiển thị và tìm kiếm)
let g_Authors = {};
let g_Categories = {};
let g_Publishers = {};
let searchTimeout = null; 

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 DOM Loaded");
    
    // Tải Metadata trước để có dữ liệu mapping (ID -> Tên)
    await loadMetadata();
    // Sau đó mới tải sách
    loadBooks();

    // Gắn sự kiện tìm kiếm
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
        
        if (result.status) {
            allBooksData = result.data || []; 
        } else {
            allBooksData = []; 
        }

        renderTable(allBooksData);
        
    } catch (error) {
        console.error("Lỗi tải sách:", error);
        if(tableBody) tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:red">❌ Lỗi kết nối: ${error.message}</td></tr>`;
    }
}

// 2. TẢI DANH MỤC CON (Metadata)
async function loadMetadata() {
    try {
        const [resTG, resTL, resNXB] = await Promise.all([
            fetch(AppConfig.getUrl('tacgia')),
            fetch(AppConfig.getUrl('theloai')),
            fetch(AppConfig.getUrl('nhaxuatban'))
        ]);
        
        const [jsonTG, jsonTL, jsonNXB] = await Promise.all([resTG.json(), resTL.json(), resNXB.json()]);

        // Hàm điền Select box
        const fillSelect = (data, elementId, mapObj, idKey, nameKey) => {
            const el = document.getElementById(elementId);
            let html = `<option value="">-- Chọn --</option>`;
            
            if (data.status && data.data) {
                data.data.forEach(i => {
                    mapObj[i[idKey]] = i[nameKey]; // Lưu vào Map
                    if(el) html += `<option value="${i[idKey]}">${i[nameKey]}</option>`;
                });
            }
            if(el) el.innerHTML = html;
        };

        // Hàm điền Datalist (Dành riêng cho Tác giả để hỗ trợ nhập mới)
        const fillDataList = (data, elementId, mapObj, idKey, nameKey) => {
            const el = document.getElementById(elementId);
            let html = "";
            if (data.status && data.data) {
                data.data.forEach(i => {
                    mapObj[i[idKey]] = i[nameKey]; // Lưu vào Map ID->Tên
                    // Lưu thêm Map Tên->ID để tra ngược khi lưu
                    mapObj["NAME_" + i[nameKey].toLowerCase()] = i[idKey]; 
                    if(el) html += `<option value="${i[nameKey]}"></option>`;
                });
            }
            if(el) el.innerHTML = html;
        };

        // Load Tác giả vào Datalist
        fillDataList(jsonTG, 'listTacGia', g_Authors, 'TacGiaID', 'TenTacGia');
        
        // Load Thể loại & NXB vào Select thường
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
    
    let newHTML = "";

    if (!list || list.length === 0) {
        newHTML = `<tr><td colspan="10" style="text-align:center; padding: 20px;">Không tìm thấy kết quả phù hợp</td></tr>`;
    } else {
        list.forEach(item => {
            // Xử lý ảnh
            let imgSrc = DEFAULT_IMAGE_URL; 
            if (item.AnhBia && item.AnhBia !== "null" && item.AnhBia.trim() !== "") {
                if (item.AnhBia.startsWith('http')) {
                    imgSrc = item.AnhBia;
                } else {
                    let cleanName = item.AnhBia.startsWith('/') ? item.AnhBia.substring(1) : item.AnhBia;
                    imgSrc = IMAGE_BASE_URL + cleanName;
                }
            }

            const gia = new Intl.NumberFormat('vi-VN').format(item.Gia) + 'đ';
            
            let statusBadge = `<span class="status-badge status-completed">Đang bán</span>`;
            if(item.TrangThai == 0) statusBadge = `<span class="status-badge status-cancelled">Ngừng bán</span>`;
            if(item.TrangThai == 2) statusBadge = `<span class="status-badge status-pending">Hết hàng</span>`;

            // Lấy tên từ Map
            const tacGia = g_Authors[item.TacGiaID] || '---';
            const theLoai = g_Categories[item.TheLoaiID] || '---';
            const nxb = g_Publishers[item.NhaXuatBanID] || '---';

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

// 4. CHỨC NĂNG TÌM KIẾM
function applyFilter() {
    const searchInput = document.getElementById("searchBook");
    if (!searchInput) return;

    const keyword = searchInput.value.toLowerCase().trim();
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        if (!keyword) { renderTable(allBooksData); return; }
        
        const filtered = allBooksData.filter(item => {
            const matchId = item.SachID && item.SachID.toString().includes(keyword);
            const matchName = item.TenSach && item.TenSach.toLowerCase().includes(keyword);
            const authorName = (g_Authors[item.TacGiaID] || "").toLowerCase();
            const matchAuthor = authorName.includes(keyword);
            const catName = (g_Categories[item.TheLoaiID] || "").toLowerCase();
            const matchCat = catName.includes(keyword);
            const pubName = (g_Publishers[item.NhaXuatBanID] || "").toLowerCase();
            const matchPub = pubName.includes(keyword);

            return matchId || matchName || matchAuthor || matchCat || matchPub;
        });

        renderTable(filtered);
    }, 300);
}

// 5. MỞ MODAL & RESET FORM
window.openModalSach = function(sachId = null) {
    const modal = document.getElementById('editModalSach');
    const form = document.getElementById('formSach');
    
    if(!modal || !form) return;

    form.reset(); 
    document.getElementById('hiddenTenAnh').value = ""; // Reset hidden input
    
    // Reset ảnh preview
    const imgPreview = document.getElementById('previewMain').querySelector('img');
    const imgPlace = document.getElementById('previewMain').querySelector('.img-placeholder');
    if(imgPreview) { imgPreview.src=""; imgPreview.style.display = 'none'; }
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
        
        // Load Tên tác giả vào Input Text (từ ID)
        const tenTacGia = g_Authors[item.TacGiaID] || "";
        document.getElementById('inputTacGia').value = tenTacGia;

        form.querySelector('[name="TheLoaiID"]').value = item.TheLoaiID || "";
        form.querySelector('[name="NhaXuatBanID"]').value = item.NhaXuatBanID || "";
        
        // Load ảnh vào hidden input & preview
        if(item.AnhBia) {
            document.getElementById('hiddenTenAnh').value = item.AnhBia;
            previewImage(item.AnhBia, 'previewMain');
        }

    } else {
        // --- CHẾ ĐỘ THÊM MỚI ---
        document.getElementById('modalTitleSach').innerText = "Thêm sách mới";
        form.querySelector('[name="SachID"]').value = "";
    }

    modal.classList.add('show'); 
}

// 6. XỬ LÝ CHỌN FILE TỪ MÁY
window.handleFileSelect = function(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // 1. Hiển thị Preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const box = document.getElementById('previewMain');
            const img = box.querySelector('img');
            const ph = box.querySelector('.img-placeholder');
            
            img.src = e.target.result;
            img.style.display = 'block';
            ph.style.display = 'none';
        }
        reader.readAsDataURL(file);

        // 2. Gán tên file vào input hidden (Giả lập upload)
        document.getElementById('hiddenTenAnh').value = file.name;
    }
}

// 7. LƯU DỮ LIỆU (CÓ BẪY LỖI CHẶT CHẼ)
window.saveDataSach = async function() {
    const form = document.getElementById('formSach');
    
    // Lấy dữ liệu từ form
    const formData = new FormData(form);
    const rawData = Object.fromEntries(formData.entries());

    // --- BẮT ĐẦU BẪY LỖI (VALIDATION) ---
    const soLuong = parseInt(rawData.SoLuong || 0);
    const giamGia = parseInt(rawData.PhanTramGiam || 0);
    const giaBan = parseFloat(rawData.Gia || 0);

    // Bẫy lỗi Tồn kho: Không được số âm
    if (soLuong < 0) {
        alert("⚠️ Lỗi nhập liệu: Số lượng tồn kho không được là số âm!");
        // Đưa con trỏ chuột về ô nhập liệu bị sai
        const inputSL = form.querySelector('[name="SoLuong"]');
        if(inputSL) {
            inputSL.value = 0; // Reset về 0
            inputSL.focus();
        }
        return; // Dừng lại, không gửi dữ liệu
    }

    // Bẫy lỗi Giảm giá: Phải dưới 50% (>= 50 là lỗi)
    if (giamGia >= 50) {
        alert("⚠️ Lỗi nhập liệu: Phần trăm giảm giá phải nhỏ hơn 50%!");
        const inputGG = form.querySelector('[name="PhanTramGiam"]');
        if(inputGG) {
            inputGG.value = 0; 
            inputGG.focus();
        }
        return; 
    }

    if (giamGia < 0) {
        alert("⚠️ Lỗi nhập liệu: Phần trăm giảm giá không được là số âm!");
        return;
    }

    if (giaBan <= 0) {
        alert("⚠️ Lỗi nhập liệu: Giá bán phải lớn hơn 0!");
        return;
    }

    // --- XỬ LÝ TÁC GIẢ (Tự động tạo mới nếu chưa có) ---
    const tenTacGiaInput = document.getElementById('inputTacGia').value.trim();
    let finalTacGiaID = null;

    if (tenTacGiaInput) {
        const keyName = "NAME_" + tenTacGiaInput.toLowerCase();
        if (g_Authors[keyName]) {
            // Đã có -> Lấy ID
            finalTacGiaID = g_Authors[keyName];
        } else {
            // Chưa có -> Gọi API tạo mới
            try {
                if(confirm(`Tác giả "${tenTacGiaInput}" chưa có trong hệ thống. Bạn có muốn tạo mới không?`)) {
                    const resNewTG = await fetch(AppConfig.getUrl('tacgia/tao'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ TenTacGia: tenTacGiaInput })
                    });
                    const dataNewTG = await resNewTG.json();
                    
                    if(dataNewTG.status) {
                        // Reload lại Metadata để cập nhật ID mới
                        await loadMetadata();
                        // Lấy ID mới vừa tạo
                        finalTacGiaID = g_Authors["NAME_" + tenTacGiaInput.toLowerCase()];
                    } else {
                        alert("Không thể tạo tác giả mới: " + dataNewTG.message);
                        return;
                    }
                } else {
                    return; // Người dùng hủy, dừng lưu
                }
            } catch (e) {
                console.error(e);
                alert("Lỗi khi tạo tác giả mới");
                return;
            }
        }
    }

    // --- CHUẨN BỊ PAYLOAD GỬI ĐI ---
    const payload = {
        TenSach: rawData.TenSach,
        Gia: giaBan,
        PhanTramGiam: giamGia,
        SoLuong: soLuong,
        TrangThai: parseInt(rawData.TrangThai),
        AnhBia: document.getElementById('hiddenTenAnh').value || "", // Lấy từ hidden input
        MoTa: rawData.MoTa || "",
        TacGiaID: finalTacGiaID, // ID đã xử lý ở trên
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
            alert("✅ Lưu thành công!");
            closeModal('editModalSach');
            loadBooks();
        } else {
            alert("❌ Lỗi: " + result.message);
        }
    } catch (e) {
        alert("Lỗi kết nối: " + e.message);
    }
}

// 8. CÁC HÀM KHÁC (Delete, Preview, Helper)
window.deleteBook = async function(id) {
    if (!confirm("Bạn có chắc muốn xóa sách này?")) return;
    try {
        const res = await fetch(AppConfig.getUrl('sach/xoa'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ SachID: id })
        });
        const result = await res.json();
        if (result.status) { alert("✅ Đã xóa!"); loadBooks(); } else { alert("⚠️ " + result.message); }
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
        if(!val.startsWith('http') && !val.startsWith('data:')) val = IMAGE_BASE_URL + val;
        img.src = val;
        img.style.display = 'block';
        ph.style.display = 'none';
        img.onerror = function() {
            img.style.display = 'none';
            ph.style.display = 'block';
        };
    } else {
        img.style.display = 'none';
        ph.style.display = 'block';
    }
}