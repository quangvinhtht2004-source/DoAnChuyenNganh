// admin-khuyenmai.js

let allData = [];

document.addEventListener("DOMContentLoaded", () => {
    loadData();
});

// ===============================================
// 1. TẢI DỮ LIỆU TỪ SERVER
// ===============================================
async function loadData() {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">⏳ Đang tải...</td></tr>`;

    try {
        const res = await fetch(AppConfig.getUrl('khuyen-mai'));
        const result = await res.json();

        if (result.status) {
            allData = result.data;
            renderTable(allData);
        } else {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">${result.message}</td></tr>`;
        }
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Lỗi kết nối server!</td></tr>`;
    }
}

// ===============================================
// 2. HIỂN THỊ BẢNG (LOGIC TRẠNG THÁI)
// ===============================================
function renderTable(list) {
    const tbody = document.getElementById("tableBody");
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Chưa có mã khuyến mãi nào</td></tr>`;
        return;
    }

    let html = "";
    const now = new Date();
    // Reset giờ về 0 để so sánh ngày chính xác hơn (tùy chọn)
    now.setHours(0,0,0,0); 

    list.forEach(item => {
        // --- Xử lý hiển thị Loại & Giá trị ---
        let typeBadge = '';
        let valueDisplay = '';
        if (item.LoaiKM === 'phantram') {
            typeBadge = '<span class="status-badge" style="background:#fff7ed; color:#ea580c; border:1px solid #fed7aa">Theo %</span>';
            valueDisplay = `<span style="font-weight:bold; color:#ea580c;">-${item.GiaTri}%</span>`;
        } else {
            typeBadge = '<span class="status-badge" style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0">Tiền mặt</span>';
            valueDisplay = `<span style="font-weight:bold; color:#16a34a;">-${new Intl.NumberFormat('vi-VN').format(item.GiaTri)}đ</span>`;
        }

        // --- Xử lý Ngày hết hạn ---
        let dateDisplay = '<span style="color:#16a34a; font-size:13px;">Vĩnh viễn</span>';
        let isExpired = false;
        
        if (item.NgayKetThuc) {
            const endDate = new Date(item.NgayKetThuc);
            // So sánh: nếu ngày kết thúc nhỏ hơn ngày hiện tại
            if (endDate < now) isExpired = true;
            dateDisplay = endDate.toLocaleDateString('vi-VN');
        }

        // --- Xử lý Trạng thái (Logic quan trọng) ---
        let statusBadge = '';
        const dbStatus = parseInt(item.TrangThai ?? 1); // Mặc định 1 nếu null
        const soLuong = parseInt(item.SoLuong || 0);

        if (dbStatus === 0) {
            // Admin chủ động tắt
            statusBadge = '<span class="status-badge status-cancelled" style="background:#fee2e2; color:#991b1b; border:1px solid #fecaca"><i class="fa-solid fa-lock"></i> Đã khóa</span>';
        } else if (soLuong <= 0) {
            // Hết lượt
            statusBadge = '<span class="status-badge status-cancelled" style="background:#f3f4f6; color:#6b7280; border:1px solid #e5e7eb"><i class="fa-solid fa-box-open"></i> Hết mã</span>';
        } else if (isExpired) {
            // Hết hạn
            statusBadge = '<span class="status-badge status-cancelled" style="background:#fff1f2; color:#be123c; border:1px solid #fda4af"><i class="fa-regular fa-clock"></i> Hết hạn</span>';
        } else {
            // Đang hoạt động
            statusBadge = '<span class="status-badge status-completed"><i class="fa-solid fa-check"></i> Hoạt động</span>';
        }

        // --- Render dòng ---
        // Chuyển object thành string để truyền vào hàm sửa
        const itemStr = encodeURIComponent(JSON.stringify(item));

        html += `
            <tr>
                <td>#${item.KhuyenMaiID}</td>
                <td><span style="font-weight:800; font-size:1.1em; letter-spacing:1px; color:#4f46e5;">${item.Code}</span></td>
                <td>${typeBadge}</td>
                <td>${valueDisplay}</td>
                <td>
                    <div style="font-weight:bold;">SL: ${soLuong}</div>
                    <div style="font-size:11px; color:#666;">Đơn từ: ${new Intl.NumberFormat('vi-VN').format(item.DonToiThieu)}đ</div>
                </td>
                <td>${dateDisplay}</td>
                <td style="text-align:center;">${statusBadge}</td>
                <td class="action-col">
                    <button class="btn-icon btn-edit" onclick="openModal('${itemStr}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon btn-delete" onclick="deleteItem(${item.KhuyenMaiID})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// ===============================================
// 3. MỞ MODAL THÊM / SỬA
// ===============================================
window.openModal = function(itemStr = null) {
    const modal = document.getElementById("editModal");
    const form = document.getElementById("dataForm");
    const title = document.getElementById("modalTitle");
    
    form.reset(); // Xóa dữ liệu cũ

    if (itemStr) {
        // --- CHẾ ĐỘ SỬA ---
        const item = JSON.parse(decodeURIComponent(itemStr));
        title.innerText = `Cập nhật mã: ${item.Code}`;
        
        form.querySelector('[name="KhuyenMaiID"]').value = item.KhuyenMaiID;
        form.querySelector('[name="Code"]').value = item.Code;
        form.querySelector('[name="LoaiKM"]').value = item.LoaiKM;
        form.querySelector('[name="GiaTri"]').value = item.GiaTri;
        form.querySelector('[name="DonToiThieu"]').value = item.DonToiThieu;
        form.querySelector('[name="SoLuong"]').value = item.SoLuong;
        
        // Load ngày tháng
        if (item.NgayKetThuc) {
            form.querySelector('[name="NgayKetThuc"]').value = item.NgayKetThuc.split('T')[0];
        }

        // Load trạng thái (Quan trọng)
        const statusSelect = form.querySelector('[name="TrangThai"]');
        if (statusSelect) {
            statusSelect.value = (item.TrangThai !== undefined && item.TrangThai !== null) ? item.TrangThai : 1;
        }

    } else {
        // --- CHẾ ĐỘ THÊM MỚI ---
        title.innerText = "Thêm mã khuyến mãi mới";
        form.querySelector('[name="KhuyenMaiID"]').value = "";
        form.querySelector('[name="SoLuong"]').value = "100";
        form.querySelector('[name="TrangThai"]').value = "1"; // Mặc định Hoạt động
    }

    updatePlaceholder();
    modal.classList.add("show");
}

window.closeModal = function() {
    document.getElementById("editModal").classList.remove("show");
}

// ===============================================
// 4. LƯU DỮ LIỆU (THÊM / SỬA)
// ===============================================
window.saveData = async function() {
    const form = document.getElementById("dataForm");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validation cơ bản
    if (!data.Code || !data.GiaTri) {
        alert("Vui lòng nhập Mã code và Giá trị giảm!");
        return;
    }

    // Payload gửi lên server
    const payload = {
        KhuyenMaiID: data.KhuyenMaiID || null,
        Code: data.Code.trim().toUpperCase(),
        LoaiKM: data.LoaiKM,
        GiaTri: parseFloat(data.GiaTri),
        DonToiThieu: parseFloat(data.DonToiThieu || 0),
        SoLuong: parseInt(data.SoLuong || 0),
        NgayKetThuc: data.NgayKetThuc || null,
        TrangThai: parseInt(data.TrangThai) // Gửi trạng thái lên Server
    };

    const url = payload.KhuyenMaiID ? AppConfig.getUrl('khuyen-mai/sua') : AppConfig.getUrl('khuyen-mai/tao');

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (result.status) {
            alert("✅ Thành công!");
            closeModal();
            loadData(); // Tải lại bảng
        } else {
            alert("❌ Lỗi: " + result.message);
        }
    } catch (e) {
        alert("Lỗi kết nối server!");
    }
}

// ===============================================
// 5. XÓA MÃ
// ===============================================
window.deleteItem = async function(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa mã này vĩnh viễn không?\n(Khuyên dùng: Nên chuyển trạng thái sang 'Tạm khóa' thay vì xóa)")) {
        return;
    }

    try {
        const res = await fetch(AppConfig.getUrl('khuyen-mai/xoa'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ KhuyenMaiID: id })
        });
        const result = await res.json();
        
        if (result.status) {
            alert("Đã xóa thành công!");
            loadData();
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (e) {
        alert("Lỗi kết nối!");
    }
}

// Hàm bổ trợ UI
window.updatePlaceholder = function() {
    const type = document.querySelector('select[name="LoaiKM"]').value;
    const input = document.querySelector('input[name="GiaTri"]');
    if (type === 'phantram') {
        input.placeholder = "Nhập % (VD: 10)";
    } else {
        input.placeholder = "Nhập tiền (VD: 50000)";
    }
}