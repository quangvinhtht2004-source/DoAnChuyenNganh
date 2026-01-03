// ===============================================
// HELPER FUNCTIONS
// ===============================================

function formatDate(d) {
    if(!d) return '<span style="color:#22c55e">Vĩnh viễn</span>'; // Nếu null thì là vĩnh viễn
    const date = new Date(d);
    if (isNaN(date.getTime())) return '---';
    return date.toLocaleDateString('vi-VN');
}

function formatDateInput(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split('T')[0];
}

// Thay đổi placeholder khi chọn loại KM
function updatePlaceholder() {
    const type = document.querySelector('select[name="LoaiKM"]').value;
    const input = document.querySelector('input[name="GiaTri"]');
    if (type === 'phantram') {
        input.placeholder = "Nhập % (VD: 10)";
    } else {
        input.placeholder = "Nhập tiền (VD: 50000)";
    }
}

// ===============================================
// MAIN LOGIC
// ===============================================

document.addEventListener("DOMContentLoaded", () => {
    
    initPage({
        apiUrl: 'khuyen-mai', 
        idField: 'KhuyenMaiID', 
        
        // --- 1. TÙY CHỈNH HIỂN THỊ DÒNG ---
        renderRow: (item) => {
            const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');
            
            // Xử lý loại giảm giá
            const loaiKM = (item.LoaiKM || 'phantram'); 
            let valDisplay = '';
            let typeText = '';

            if (loaiKM === 'phantram') {
                typeText = '<span style="color:#d97706; font-size:11px; border:1px solid #d97706; padding:1px 4px; border-radius:3px;">%</span>';
                valDisplay = `<span style="font-weight:bold; color:#d97706; font-size:1.1em;">-${item.GiaTri}%</span>`;
            } else {
                typeText = '<span style="color:#16a34a; font-size:11px; border:1px solid #16a34a; padding:1px 4px; border-radius:3px;">Tiền</span>';
                valDisplay = `<span style="font-weight:bold; color:#16a34a; font-size:1.1em;">-${new Intl.NumberFormat('vi-VN').format(item.GiaTri)}đ</span>`;
            }

            // Xử lý thông tin phụ
            const soLuong = parseInt(item.SoLuong || 0);
            const donToiThieu = parseInt(item.DonToiThieu || 0);
            const minOrderText = donToiThieu > 0 ? `Đơn từ: ${new Intl.NumberFormat('vi-VN').format(donToiThieu)}đ` : 'Mọi đơn hàng';

            // Xử lý trạng thái (Tự động tính toán)
            const now = new Date();
            now.setHours(0,0,0,0);
            const endDate = item.NgayKetThuc ? new Date(item.NgayKetThuc) : null;
            
            let statusBadge = '';
            let isExpired = endDate && endDate < now;

            if (soLuong <= 0) {
                statusBadge = '<span class="status-badge status-cancelled" style="background:#f3f4f6; color:#6b7280; border:1px solid #e5e7eb"><i class="fa-solid fa-box-open"></i> Hết mã</span>';
            } else if (isExpired) {
                statusBadge = '<span class="status-badge status-cancelled" style="background:#fff1f2; color:#be123c; border:1px solid #fda4af"><i class="fa-regular fa-clock"></i> Hết hạn</span>';
            } else {
                statusBadge = '<span class="status-badge status-completed"><i class="fa-solid fa-check"></i> Hoạt động</span>';
            }

            return `
                <td>#${item.KhuyenMaiID}</td>
                <td>
                    <div style="font-weight:800; color:var(--primary-color); font-size:1.1em; letter-spacing:0.5px;">${item.Code}</div>
                </td>
                <td>${typeText}</td>
                <td>${valDisplay}</td>
                <td>
                    <div style="font-weight:bold;">Còn: ${soLuong}</div>
                    <div style="font-size:11px; color:#666;">${minOrderText}</div>
                </td>
                <td style="font-size:13px; color:#555;">
                    ${formatDate(item.NgayKetThuc)}
                </td>
                <td style="text-align:center;">${statusBadge}</td>
                <td class="action-col">
                    <button class="btn-icon btn-edit" onclick="openModal(${itemJson})" title="Sửa">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteItem(${item.KhuyenMaiID})" title="Xóa">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
        },

        // --- 2. TÙY CHỈNH KHI MỞ FORM SỬA ---
        onEdit: (item) => {
            const form = document.getElementById("dataForm");
            
            // Chỉ điền các trường còn lại trong DB
            if (item.NgayKetThuc) {
                const inpEnd = form.querySelector('[name="NgayKetThuc"]');
                if(inpEnd) inpEnd.value = formatDateInput(item.NgayKetThuc);
            }

            const selType = form.querySelector('[name="LoaiKM"]');
            if(selType) selType.value = item.LoaiKM || 'phantram';

            if(form.querySelector('[name="Code"]')) form.querySelector('[name="Code"]').value = item.Code || '';
            if(form.querySelector('[name="GiaTri"]')) form.querySelector('[name="GiaTri"]').value = item.GiaTri || '';
            if(form.querySelector('[name="SoLuong"]')) form.querySelector('[name="SoLuong"]').value = item.SoLuong || 0;
            if(form.querySelector('[name="DonToiThieu"]')) form.querySelector('[name="DonToiThieu"]').value = item.DonToiThieu || 0;
            
            updatePlaceholder(); // Cập nhật placeholder cho đúng loại
        }
    });
});