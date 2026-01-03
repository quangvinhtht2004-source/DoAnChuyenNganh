// ===============================================
// 1. KHỞI TẠO VÀ BIẾN TOÀN CỤC
// ===============================================
let originalOrders = []; 

document.addEventListener("DOMContentLoaded", () => {
    loadDonHang();
    setupFilterListeners();
});

// --- HÀM HỖ TRỢ BÓC TÁCH TÊN TỪ GHI CHÚ ---
function parseOrderInfo(order) {
    let finalName = order.NguoiDat || "Khách vãng lai"; // Mặc định lấy tên User
    let realNote = order.GhiChu || "";

    // Nếu GhiChu có chứa format "Người nhận: ..." do Backend tạo ra
    if (order.GhiChu && order.GhiChu.includes("Người nhận:")) {
        // Chuỗi: "Người nhận: Tên ABC. Note: Ghi chú XYZ"
        const parts = order.GhiChu.split(". Note:");
        
        // Lấy tên (Phần đầu tiên, bỏ chữ "Người nhận:")
        if (parts[0]) {
            finalName = parts[0].replace("Người nhận:", "").trim();
        }
        
        // Lấy ghi chú thực (Phần sau)
        if (parts[1]) {
            realNote = parts[1].trim();
        } else {
            realNote = ""; // Nếu không có ghi chú thêm
        }
    }

    return {
        name: finalName,
        note: realNote,
        phone: order.SoDienThoai || "N/A",
        address: order.DiaChiGiao || "N/A",
        total: parseInt(order.TongTien || 0).toLocaleString('vi-VN') + 'đ',
        date: new Date(order.NgayTao || order.NgayDat).toLocaleString('vi-VN'),
        status: order.TrangThai
    };
}

// ===============================================
// 2. TẢI DANH SÁCH ĐƠN HÀNG TỪ API
// ===============================================
async function loadDonHang() {
    const tableBody = document.getElementById("donHangTable");
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Đang tải dữ liệu...</td></tr>`;

    try {
        const url = AppConfig.getUrl("don-hang/all");
        const res = await fetch(url);
        const data = await res.json();

        if (data.status && Array.isArray(data.data)) {
            originalOrders = data.data; 
            renderTable(originalOrders);
        } else {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${data.message || "Không có dữ liệu"}</td></tr>`;
        }

    } catch (err) {
        console.error("Lỗi tải danh sách:", err);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Lỗi kết nối API</td></tr>`;
    }
}

// ===============================================
// 3. HIỂN THỊ DỮ LIỆU (LIST)
// ===============================================
function renderTable(list) {
    const tableBody = document.getElementById("donHangTable");
    
    if (!list || list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Không tìm thấy đơn hàng nào</td></tr>`;
        return;
    }

    let html = "";
    list.forEach(order => {
        let statusBadge = "";
        let statusText = "";

        // Map trạng thái
        switch (order.TrangThai) {
            case "ChoXacNhan": statusBadge = "status-pending"; statusText = "Chờ xác nhận"; break;
            case "DangXuLy":   statusBadge = "status-processing"; statusText = "Đang xử lý"; break;
            case "DangGiao":   statusBadge = "status-processing"; statusText = "Đang giao"; break;
            case "HoanThanh":  statusBadge = "status-completed"; statusText = "Hoàn thành"; break;
            case "DaHuy":      statusBadge = "status-cancelled"; statusText = "Đã hủy"; break;
            default:           statusBadge = ""; statusText = order.TrangThai;
        }

        // SỬ DỤNG HÀM PARSE ĐỂ LẤY TÊN ĐÚNG
        const info = parseOrderInfo(order);

        html += `
            <tr>
                <td style="text-align:left; font-weight:600; color:#EB7347;">#${order.DonHangID}</td>
                <td>
                    <div style="font-weight:600; color:#333;">${info.name}</div>
                    <div style="font-size:12px; color:#777;">${info.phone}</div>
                </td>
                <td style="font-size:13px;">${info.date}</td>
                <td style="font-weight:700;">${info.total}</td>
                <td style="text-align:left;">
                    <span class="status-badge ${statusBadge}">${statusText}</span>
                </td>
                <td class="action-col">
                    <button class="btn-icon btn-view" title="Xem chi tiết" onclick="openOrderModal('${order.DonHangID}')">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

// ===============================================
// 4. XEM CHI TIẾT ĐƠN HÀNG (MODAL)
// ===============================================
window.openOrderModal = async function(orderId) {
    const order = originalOrders.find(o => o.DonHangID == orderId);
    
    if (!order) {
        console.error("Không tìm thấy đơn hàng ID:", orderId);
        return;
    }

    // SỬ DỤNG HÀM PARSE ĐỂ HIỂN THỊ CHI TIẾT
    const info = parseOrderInfo(order);

    // 1. Điền thông tin chung vào Modal
    document.getElementById("modalOrderId").innerText = "#" + order.DonHangID;
    
    // ĐIỀN TÊN NGƯỜI NHẬN ĐÃ BÓC TÁCH
    document.getElementById("detailName").innerText = info.name; 
    document.getElementById("detailPhone").innerText = info.phone;
    document.getElementById("detailAddress").innerText = info.address;
    document.getElementById("detailDate").innerText = info.date;

    // Hiển thị ghi chú nếu có (Nếu HTML modal có chỗ hiển thị ghi chú thì bỏ comment dòng dưới)
    // if(document.getElementById("detailNote")) document.getElementById("detailNote").innerText = info.note;
    
    // Set trạng thái select box
    const statusSelect = document.getElementById("updateStatus");
    if(statusSelect) statusSelect.value = order.TrangThai;
    
    const saveBtn = document.querySelector(".btn-save");
    if(saveBtn) saveBtn.setAttribute("data-id", orderId);

    // 2. Tải chi tiết sản phẩm
    const itemsTable = document.getElementById("orderItemsTable");
    itemsTable.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px;">Đang tải sản phẩm...</td></tr>`;

    const modal = document.getElementById("orderModal");
    modal.classList.add("show");
    modal.style.display = "flex";

    try {
        const url = AppConfig.getUrl(`don-hang/chi-tiet?id=${orderId}`);
        const res = await fetch(url);
        const data = await res.json();

        if (data.status && Array.isArray(data.data)) {
            let itemHtml = "";
            let total = 0;

            data.data.forEach(item => {
                const donGia = item.DonGia ? parseInt(item.DonGia) : (item.GiaBan ? parseInt(item.GiaBan) : 0);
                const soLuong = parseInt(item.SoLuong || 0);
                const thanhTien = donGia * soLuong;
                total += thanhTien;

                itemHtml += `
                    <tr>
                        <td style="font-weight:500;">${item.TenSach || 'Sản phẩm ' + item.SachID}</td>
                        <td>${donGia.toLocaleString('vi-VN')}đ</td>
                        <td style="text-align:center;">${soLuong}</td>
                        <td style="text-align:right; font-weight:600;">${thanhTien.toLocaleString('vi-VN')}đ</td>
                    </tr>
                `;
            });

            itemsTable.innerHTML = itemHtml;
            document.getElementById("detailTotal").innerText = total.toLocaleString('vi-VN') + 'đ';
        } else {
            itemsTable.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px;">Không có sản phẩm.</td></tr>`;
            document.getElementById("detailTotal").innerText = "0đ";
        }

    } catch (e) {
        console.error("Lỗi tải chi tiết:", e);
        itemsTable.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red; padding:15px;">Lỗi tải dữ liệu sản phẩm.</td></tr>`;
    }
}

// Hàm đóng Modal
window.closeModal = function() {
    const modal = document.getElementById("orderModal");
    modal.classList.remove("show");
    modal.style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById("orderModal");
    if (event.target == modal) {
        closeModal();
    }
}

// ===============================================
// 5. CẬP NHẬT TRẠNG THÁI
// ===============================================
window.updateOrderStatus = async function() {
    const saveBtn = document.querySelector(".btn-save");
    const orderId = saveBtn ? saveBtn.getAttribute("data-id") : null;
    const newStatus = document.getElementById("updateStatus").value;

    if (!orderId) {
        alert("Lỗi ID đơn hàng!");
        return;
    }

    if (!confirm("Xác nhận cập nhật trạng thái?")) return;

    try {
        const url = AppConfig.getUrl("don-hang/cap-nhat");
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                DonHangID: orderId,
                TrangThai: newStatus
            })
        });

        const result = await res.json();

        if (result.status) {
            alert("Cập nhật thành công!");
            closeModal();
            loadDonHang(); // Refresh list
        } else {
            alert("Lỗi: " + (result.message || "Thất bại"));
        }

    } catch (e) {
        console.error(e);
        alert("Lỗi kết nối!");
    }
}

// ===============================================
// 6. BỘ LỌC (SEARCH)
// ===============================================
function setupFilterListeners() {
    const searchInput = document.getElementById("searchOrder");
    const filterSelect = document.getElementById("filterStatus");
    if(searchInput) searchInput.addEventListener("input", applyFilter);
    if(filterSelect) filterSelect.addEventListener("change", applyFilter);
}

function applyFilter() {
    const term = document.getElementById("searchOrder").value.toLowerCase();
    const status = document.getElementById("filterStatus").value;

    const filtered = originalOrders.filter(order => {
        // Dùng hàm parse để tìm kiếm trên tên người nhận thực tế
        const info = parseOrderInfo(order);
        
        const orderIdStr = String(order.DonHangID).toLowerCase();
        const nameStr = info.name.toLowerCase();
        
        const matchTerm = !term || orderIdStr.includes(term) || nameStr.includes(term);
        const matchStatus = !status || order.TrangThai === status;

        return matchTerm && matchStatus;
    });

    renderTable(filtered);
}