// Biến toàn cục để lưu dữ liệu
let dashboardData = {
    orders: [],
    users: []
};

document.addEventListener("DOMContentLoaded", () => {
    initDashboard();
});

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

// --- HÀM BÓC TÁCH TÊN NGƯỜI NHẬN TỪ GHI CHÚ ---
function parseDashboardOrderInfo(order) {
    let finalName = order.NguoiDat || order.HoTen || `Khách #${order.KhachHangID || '?'}`;
    
    // Nếu GhiChu có chứa format "Người nhận: ..."
    if (order.GhiChu && order.GhiChu.includes("Người nhận:")) {
        const parts = order.GhiChu.split(". Note:");
        if (parts[0]) {
            finalName = parts[0].replace("Người nhận:", "").trim();
        }
    }
    return { name: finalName };
}

// --- MAIN LOGIC ---
async function initDashboard() {
    // 1. Hiển thị tên Admin
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    if (adminInfo.name || adminInfo.HoTen) {
        const el = document.getElementById('adminName');
        if(el) el.innerText = adminInfo.name || adminInfo.HoTen;
    }

    try {
        // --- BƯỚC 1: LẤY DANH SÁCH ĐƠN HÀNG ---
        const ordersRes = await fetch(AppConfig.getUrl("don-hang/all"));
        const ordersData = await ordersRes.json();
        
        let orders = [];
        if (ordersData.status && ordersData.data) {
            orders = ordersData.data;

            // --- BƯỚC 2: LẤY CHI TIẾT SẢN PHẨM CHO TỪNG ĐƠN ---
            const detailPromises = orders.map(async (order) => {
                try {
                    const detailRes = await fetch(AppConfig.getUrl(`don-hang/chi-tiet?id=${order.DonHangID}`));
                    const detailData = await detailRes.json();
                    
                    if (detailData.status && detailData.data) {
                        order.ChiTiet = detailData.data; 
                    } else {
                        order.ChiTiet = [];
                    }
                } catch (e) {
                    order.ChiTiet = [];
                }
                return order;
            });

            orders = await Promise.all(detailPromises);
            dashboardData.orders = orders;
        }

        // --- BƯỚC 3: LẤY DỮ LIỆU USER ---
        const usersRes = await fetch(AppConfig.getUrl("user"));
        const usersData = await usersRes.json();
        
        if (usersData.status && usersData.data) {
            dashboardData.users = usersData.data;
        }

        // 4. Cập nhật Stats Cards
        updateStats();

        // 5. Render Bảng Đơn hàng mới nhất
        renderRecentOrders(dashboardData.orders);

        // 6. Render Charts với dữ liệu thực
        renderRevenueStats(dashboardData.orders);
        renderTopBooksRanking(dashboardData.orders);

    } catch (error) {
        console.error("Lỗi Dashboard:", error);
    }
}

function updateStats() {
    const orders = dashboardData.orders;
    const users = dashboardData.users;

    // 1. Tổng đơn hàng: Giữ nguyên
    document.getElementById("totalOrders").innerText = orders.length;
    
    // 2. Tổng doanh thu: CHỈ TÍNH ĐƠN 'HoanThanh'
    const revenue = orders.reduce((sum, o) => {
        // Chỉ cộng tiền nếu trạng thái là HoanThanh
        if (o.TrangThai === 'HoanThanh') {
            return sum + (o.TongTien ? parseFloat(o.TongTien) : 0);
        }
        return sum;
    }, 0);
    document.getElementById("totalRevenue").innerText = formatCurrency(revenue);
    
    // 3. Tổng sách đã bán: CHỈ TÍNH TỪ ĐƠN 'HoanThanh'
    const booksSold = orders.reduce((sum, o) => {
        // Chỉ đếm sách nếu đơn đã hoàn thành
        if (o.TrangThai === 'HoanThanh' && o.ChiTiet && Array.isArray(o.ChiTiet)) {
            const slDon = o.ChiTiet.reduce((s, item) => s + (parseInt(item.SoLuong) || 0), 0);
            return sum + slDon;
        }
        return sum;
    }, 0);
    document.getElementById("totalBooksSold").innerText = booksSold; 

    // 4. Tổng thành viên
    document.getElementById("totalUsers").innerText = users.length;
}

// --- RENDERING ---
function renderRecentOrders(orders) {
    const tableBody = document.getElementById("recentOrdersTable");
    if(!tableBody) return;
    
    const sortedOrders = [...orders].sort((a, b) => a.DonHangID - b.DonHangID);
    const recentOrders = sortedOrders.slice(0, 5);

    const statusMap = { 
        'ChoXacNhan': {text:'Chờ xác nhận', class:'status-pending'}, 
        'DangXuLy': {text:'Đang xử lý', class:'status-processing'}, 
        'DangGiao': {text:'Đang giao', class:'status-processing'}, 
        'HoanThanh': {text:'Hoàn thành', class:'status-completed'}, 
        'DaHuy': {text:'Đã hủy', class:'status-cancelled'} 
    };
    
    let html = recentOrders.map(order => {
        const stt = statusMap[order.TrangThai] || { text: order.TrangThai, class: '' };
        const info = parseDashboardOrderInfo(order);
        
        return `
            <tr>
                <td style="font-weight:600; color:var(--primary-color);">#${order.DonHangID}</td>
                <td><div style="display:flex; align-items:center; gap:8px;">${info.name}</div></td>
                <td style="font-weight:600;">${formatCurrency(order.TongTien || 0)}</td>
                <td><span class="status-badge ${stt.class}">${stt.text}</span></td>
                <td style="color:#6B7280;">${formatDate(order.NgayTao || order.NgayDat)}</td>
                <td style="text-align:center;">
                    <a href="donhang.html" class="btn-icon btn-view"><i class="fa-solid fa-eye"></i></a>
                </td>
            </tr>`;
    }).join('');

    if (recentOrders.length === 0) html = `<tr><td colspan="6" style="text-align:center;">Chưa có đơn hàng.</td></tr>`;
    tableBody.innerHTML = html;
}

// ================================================================
// [ĐÃ SỬA] HÀM THỐNG KÊ DOANH THU (CHỈ TÍNH NGÀY & THÁNG)
// ================================================================
function renderRevenueStats(orders) {
    const container = document.getElementById('revenueStatsList');
    if (!container) return;
    
    // 1. Lọc đơn hoàn thành
    const validOrders = orders.filter(o => o.TrangThai === 'HoanThanh');
    
    // 2. Mốc thời gian
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 00:00 hôm nay
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1); // Ngày 1 của tháng này
    
    // 3. Tính doanh thu HÔM NAY
    const todayRevenue = validOrders
        .filter(o => {
            const orderDate = new Date(o.NgayTao || o.NgayDat);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === today.getTime();
        })
        .reduce((sum, o) => sum + parseFloat(o.TongTien || 0), 0);
        
    // 4. Tính doanh thu THÁNG NÀY
    const monthRevenue = validOrders
        .filter(o => {
            const orderDate = new Date(o.NgayTao || o.NgayDat);
            // Lấy đơn từ ngày 1 đầu tháng đến hiện tại
            return orderDate >= monthStart && orderDate <= new Date(); 
        })
        .reduce((sum, o) => sum + parseFloat(o.TongTien || 0), 0);
    
    // Format hiển thị ngày tháng
    const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    const monthStr = `Tháng ${today.getMonth() + 1}/${today.getFullYear()}`;
    
    // 5. Render HTML (2 dòng: Ngày & Tháng)
    container.innerHTML = `
        <div class="stat-row">
            <div class="stat-icon-wrapper" style="background-color: #E0F2FE; color: #0284C7;">
                <i class="fa-regular fa-calendar-day"></i>
            </div>
            <div class="stat-details">
                <span class="stat-label">Hôm nay</span>
                <span class="stat-sub">${todayStr}</span>
            </div>
            <div class="stat-values">
                <span class="money-value">${formatCurrency(todayRevenue)}</span>
            </div>
        </div>

        <div class="stat-row">
            <div class="stat-icon-wrapper" style="background-color: #FFEDD5; color: #EA580C;">
                <i class="fa-regular fa-calendar-days"></i>
            </div>
            <div class="stat-details">
                <span class="stat-label">Tháng này</span>
                <span class="stat-sub">${monthStr}</span>
            </div>
            <div class="stat-values">
                <span class="money-value">${formatCurrency(monthRevenue)}</span>
            </div>
        </div>
    `;
    
    // Nếu chưa có doanh thu nào cả
    if (todayRevenue === 0 && monthRevenue === 0) {
        container.innerHTML += `
            <div style="text-align: center; padding: 15px; color: var(--text-gray); font-size: 13px; border-top:1px dashed #eee;">
                Chưa có dữ liệu doanh thu mới.
            </div>`;
    }
}

// --- RENDER TOP SÁCH BÁN CHẠY ---
function renderTopBooksRanking(orders) {
    const container = document.getElementById('topBooksRanking');
    if (!container) return;
    
    // Tính toán số lượng sách đã bán (Chỉ tính đơn HoanThanh)
    let bookStats = {};
    orders.forEach(order => {
        if (order.TrangThai === 'HoanThanh' && order.ChiTiet && Array.isArray(order.ChiTiet)) {
            order.ChiTiet.forEach(item => {
                const bookId = item.SachID;
                const bookName = item.TenSach || `Sách #${bookId}`;
                const category = item.TheLoai || 'Chưa phân loại';
                const qty = parseInt(item.SoLuong) || 0;
                
                if (!bookStats[bookId]) {
                    bookStats[bookId] = {
                        name: bookName,
                        category: category,
                        sold: 0
                    };
                }
                bookStats[bookId].sold += qty;
            });
        }
    });
    
    const sortedBooks = Object.values(bookStats).sort((a, b) => b.sold - a.sold);
    const topBooks = sortedBooks.slice(0, 4);
    
    if (topBooks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-gray);">
                <i class="fa-solid fa-book-open" style="font-size: 48px; opacity: 0.3;"></i>
                <p style="margin-top: 16px;">Chưa có sách nào được bán (từ các đơn hoàn thành)</p>
            </div>`;
        return;
    }
    
    container.innerHTML = topBooks.map((book, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        
        return `
            <div class="book-item">
                <div class="rank-badge ${rankClass}">${rank}</div>
                <div class="book-info">
                    <div class="book-title">${book.name}</div>
                    <div class="book-category">${book.category}</div>
                </div>
                <div class="book-sales">
                    <span class="sale-count">${book.sold}</span>
                    <span class="sale-label">ĐÃ BÁN</span>
                </div>
            </div>
        `;
    }).join('');
}

// --- MODAL DETAIL ---
function showDetail(type) {
    const modal = document.getElementById("dashboardDetailModal");
    const title = document.getElementById("detailModalTitle");
    const thead = document.getElementById("detailThead");
    const tbody = document.getElementById("detailTbody");
    const link = document.getElementById("viewAllLink");

    tbody.innerHTML = ""; 
    modal.classList.add("show");
    modal.style.display = "flex";

    if (type === 'revenue') {
        title.innerHTML = '<i class="fa-solid fa-sack-dollar" style="color:#166534"></i> Chi tiết Doanh thu (Đã hoàn thành)';
        link.href = "donhang.html";
        thead.innerHTML = `<tr><th>Mã đơn</th><th>Ngày</th><th>Khách hàng</th><th style="text-align:right">Số tiền</th></tr>`;
        
        // CHỈ LẤY CÁC ĐƠN HÀNG CÓ TRẠNG THÁI 'HoanThanh'
        const revenueOrders = dashboardData.orders.filter(o => o.TrangThai === 'HoanThanh'); 
        
        if(revenueOrders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">Chưa có đơn hàng nào hoàn tất thanh toán.</td></tr>`;
        } else {
            revenueOrders.forEach(o => {
                const info = parseDashboardOrderInfo(o);
                tbody.innerHTML += `<tr><td><strong>#${o.DonHangID}</strong></td><td>${formatDate(o.NgayTao || o.NgayDat)}</td><td>${info.name}</td><td style="text-align:right; font-weight:bold; color:var(--success-text)">${formatCurrency(o.TongTien)}</td></tr>`;
            });
            const total = revenueOrders.reduce((sum, o) => sum + parseFloat(o.TongTien || 0), 0);
            tbody.innerHTML += `<tr style="background:#f9fafb"><td colspan="3" style="text-align:right; font-weight:bold">TỔNG CỘNG THỰC THU:</td><td style="text-align:right; font-weight:bold; color:#166534; font-size:16px">${formatCurrency(total)}</td></tr>`;
        }
    } else if (type === 'orders') {
        title.innerHTML = '<i class="fa-solid fa-cart-shopping" style="color:#1E40AF"></i> Danh sách Đơn hàng';
        link.href = "donhang.html";
        thead.innerHTML = `<tr><th>Mã</th><th>Khách hàng</th><th>Trạng thái</th><th style="text-align:right">Tổng tiền</th></tr>`;
        const allOrders = [...dashboardData.orders].sort((a,b) => b.DonHangID - a.DonHangID);
        allOrders.forEach(o => {
            let badgeClass = '';
            if(o.TrangThai === 'HoanThanh') badgeClass = 'status-completed';
            else if(o.TrangThai === 'DaHuy') badgeClass = 'status-cancelled';
            else badgeClass = 'status-processing';
            
            const info = parseDashboardOrderInfo(o);
            tbody.innerHTML += `<tr><td>#${o.DonHangID}</td><td>${info.name}</td><td><span class="status-badge ${badgeClass}">${o.TrangThai}</span></td><td style="text-align:right">${formatCurrency(o.TongTien)}</td></tr>`;
        });
    } else if (type === 'books') {
         title.innerHTML = '<i class="fa-solid fa-book-open" style="color:#854D0E"></i> Sách bán chạy';
         link.href = "sach.html";
         thead.innerHTML = `<tr><th>Tên sách</th><th style="text-align:center">Số lượng bán</th><th style="text-align:right">Doanh thu sách</th></tr>`;
 
         let bookStats = {};
         dashboardData.orders.forEach(order => {
             if (order.ChiTiet && Array.isArray(order.ChiTiet)) {
                 order.ChiTiet.forEach(item => {
                     const tenSach = item.TenSach || `Sách ID ${item.SachID}`;
                     const sl = parseInt(item.SoLuong || 0);
                     const gia = parseFloat(item.ThanhTien || (item.DonGia * sl) || (item.GiaBan * sl) || 0);
 
                     if (!bookStats[tenSach]) bookStats[tenSach] = { sl: 0, tien: 0 };
                     bookStats[tenSach].sl += sl;
                     bookStats[tenSach].tien += gia;
                 });
             }
         });
 
         const sortedBooks = Object.entries(bookStats).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.sl - a.sl);
 
         if (sortedBooks.length === 0) {
             tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">Chưa có dữ liệu chi tiết sách.</td></tr>`;
         } else {
             sortedBooks.forEach(b => {
                 tbody.innerHTML += `<tr><td style="font-weight:500">${b.name}</td><td style="text-align:center; font-weight:bold">${b.sl}</td><td style="text-align:right">${formatCurrency(b.tien)}</td></tr>`;
             });
         }
    } else if (type === 'users') {
        title.innerHTML = '<i class="fa-solid fa-users" style="color:#7E22CE"></i> Danh sách Khách hàng';
        link.href = "users.html";
        thead.innerHTML = `<tr><th>Họ tên</th><th>Email / SĐT</th><th>Vai trò</th></tr>`;
        dashboardData.users.forEach(u => {
            tbody.innerHTML += `<tr><td style="font-weight:500">${u.HoTen || u.Username}</td><td>${u.Email || u.SoDienThoai || 'N/A'}</td><td><span class="status-badge" style="background:#F3E8FF; color:#7E22CE">${u.VaiTro || 'Khách hàng'}</span></td></tr>`;
        });
    }
}

function closeDashboardModal() {
    const modal = document.getElementById("dashboardDetailModal");
    modal.classList.remove("show");
    modal.style.display = "none";
}

window.onclick = function(event) {
    const dModal = document.getElementById("dashboardDetailModal");
    if (event.target == dModal) closeDashboardModal();
    const oModal = document.getElementById("orderModal");
    if (oModal && event.target == oModal) oModal.style.display = "none";
}