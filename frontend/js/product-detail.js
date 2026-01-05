/* ============================================================
   1. CÁC HÀM GLOBAL (Được gọi trực tiếp từ HTML onclick)
   ============================================================ */

// Biến toàn cục lưu tồn kho
let currentStock = 0;

// Chuyển tab (Giới thiệu / Thông tin / Đánh giá)
function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = "none";
    }

    const tabBtns = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabBtns.length; i++) {
        tabBtns[i].className = tabBtns[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    if(evt) evt.currentTarget.className += " active";
}

// Đổi ảnh khi click vào thumbnail
function changeImage(el) {
    document.getElementById('mainImage').src = el.src;
    document.querySelectorAll('.thumb-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

// Format tiền tệ
function formatMoney(num) {
    return Number(num).toLocaleString("vi-VN") + "đ";
}

// Thêm vào giỏ hàng
async function addDetailToCart(sachId) {
    // Không còn ô nhập số lượng -> Mặc định là 1
    const qtyInput = document.getElementById('buyQty');
    const qty = qtyInput ? parseInt(qtyInput.value) : 1;
    
    // Kiểm tra số lượng trước khi gọi API
    if (qty > currentStock) {
        alert(`Xin lỗi, sản phẩm này chỉ còn ${currentStock} cuốn trong kho!`);
        return;
    }

    const userJson = localStorage.getItem("user");
    if (!userJson) {
        if(confirm("Bạn cần đăng nhập để mua hàng. Đi đến trang đăng nhập?")) {
            window.location.href = "dangnhap.html";
        }
        return;
    }
    const user = JSON.parse(userJson);

    try {
        const url = AppConfig.getUrl("gio-hang/them");
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                UserID: user.UserID, 
                SachID: sachId, 
                SoLuong: qty 
            })
        });
        const data = await res.json();
        
        if (data.status) {
            alert("Đã thêm vào giỏ hàng thành công!");
            if (typeof updateCartBadge === 'function') updateCartBadge();
        } else {
            alert(data.message || "Lỗi thêm giỏ hàng");
        }
    } catch(e) { console.error(e); }
}

// Mua ngay
function buyNow(sachId) {
    const qtyInput = document.getElementById('buyQty');
    const qty = qtyInput ? parseInt(qtyInput.value) : 1;
    
    if (qty > currentStock) {
        alert(`Xin lỗi, sản phẩm này chỉ còn ${currentStock} cuốn trong kho!`);
        return;
    }

    addDetailToCart(sachId).then(() => {
        if(localStorage.getItem("user")) {
             window.location.href = "giohang.html";
        }
    });
}

/* ============================================================
   2. MAIN LOGIC (Chạy khi trang tải xong)
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sachId = urlParams.get('id');

    if (!sachId) {
        alert("Sản phẩm không tồn tại!");
        window.location.href = "index.html";
        return;
    }

    loadProductDetail(sachId);
    loadReviews(sachId); 

    // --- SETUP SỰ KIỆN CHO MODAL ĐÁNH GIÁ ---
    const modal = document.getElementById("reviewModal");
    const btnOpen = document.getElementById("btnOpenReviewModal");
    const btnClose = document.getElementById("btnCloseReviewModal");
    const reviewForm = document.getElementById('reviewForm');

    if(btnOpen) {
        btnOpen.onclick = function() {
            const userJson = localStorage.getItem("user");
            if (!userJson) {
                if(confirm("Bạn cần đăng nhập để viết đánh giá!")) {
                    window.location.href = "dangnhap.html";
                }
                return;
            }
            modal.style.display = "block";
        }
    }

    if(btnClose) {
        btnClose.onclick = function() {
            modal.style.display = "none";
        }
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    if(reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            const userJson = localStorage.getItem("user");
            if (!userJson) return;
            const user = JSON.parse(userJson);

            const starInput = document.querySelector('input[name="rate"]:checked');
            const content = document.getElementById('reviewContent').value.trim();

            if(!starInput) { alert("Vui lòng chọn số sao đánh giá!"); return; }
            if(content.length < 5) { alert("Nội dung đánh giá quá ngắn."); return; }

            const ratingValue = parseInt(starInput.value);
            const payload = { UserID: user.UserID, SachID: sachId, SoSao: ratingValue, BinhLuan: content };

            try {
                const url = AppConfig.getUrl('review/them'); 
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.status) {
                    alert("Cảm ơn bạn đã đánh giá!");
                    modal.style.display = "none";
                    reviewForm.reset(); 
                    loadReviews(sachId); 
                } else {
                    alert(data.message || "Có lỗi xảy ra.");
                }
            } catch(err) { console.error(err); }
        });
    }
});

/* ============================================================
   3. CÁC HÀM TẢI DỮ LIỆU & RENDER (API)
   ============================================================ */

async function loadProductDetail(id) {
    try {
        const url = AppConfig.getUrl(`sach/chi-tiet?id=${id}`); 
        const res = await fetch(url);
        const data = await res.json();

        if (data.status && data.data) {
            const book = data.data;
            document.title = `${book.TenSach} | VKDBookStore`;
            
            // Cập nhật tồn kho
            currentStock = parseInt(book.SoLuong || 0);

            renderProductInfo(book);
            renderProductDescription(book);
            renderProductSpecs(book);
            loadRelatedProducts(book.TheLoaiID);
        } else {
            document.getElementById("productMainContent").innerHTML = 
                `<p class="text-center text-danger" style="padding:50px">Không tìm thấy thông tin sách.</p>`;
        }
    } catch (err) {
        console.error("Lỗi:", err);
    }
}

function renderProductInfo(book) {
    const giaGoc = book.Gia;
    const phanTram = book.PhanTramGiam || 0;
    const giaBan = book.GiaBan || (giaGoc * (1 - phanTram/100));
    const mainImgUrl = book.AnhBia && book.AnhBia.startsWith("http") ? book.AnhBia : `../img/${book.AnhBia}`;
    
    document.getElementById("bc-category").textContent = book.TenTheLoai || "Sản phẩm";
    document.getElementById("bc-name").textContent = book.TenSach;

    const danhSachAnhPhu = book.DanhSachAnh || [];
    let thumbsHTML = `<img src="${mainImgUrl}" class="thumb-item active" onclick="changeImage(this)">`;

    if (danhSachAnhPhu && danhSachAnhPhu.length > 0) {
        danhSachAnhPhu.forEach(imgName => {
             const extraImgUrl = imgName.startsWith("http") ? imgName : `../img/${imgName}`;
             thumbsHTML += `<img src="${extraImgUrl}" class="thumb-item" onclick="changeImage(this)">`;
        });
    }

    // [ĐÃ SỬA] Xóa phần div.qty-control chứa nút + - và input
    const mainHTML = `
    <div class="detail-gallery">
        <div class="main-img-wrap">
            <img src="${mainImgUrl}" id="mainImage" onerror="this.src='https://via.placeholder.com/400x600'">
            ${phanTram > 0 ? `<span class="sale-tag-big">-${phanTram}%</span>` : ''}
        </div>
        <div class="thumb-list">${thumbsHTML}</div>
    </div>

    <div class="detail-info">
        <h1 class="detail-title">${book.TenSach}</h1>
        <div class="detail-meta-row">
            <div style="color:#555">Tác giả: <a href="#" style="color:#0D5CB6; font-weight:600">${book.TenTacGia || "Đang cập nhật"}</a></div>
            <div style="border-left:1px solid #ddd; padding-left:15px; margin-left:15px">Mã sản phẩm: <strong>BOOK-${book.SachID}</strong></div>
        </div>

        <div class="detail-price-box">
            <span class="d-price-current">${formatMoney(giaBan)}</span>
            ${phanTram > 0 ? `<span class="d-price-old">${formatMoney(giaGoc)}</span>` : ''}
        </div>

        <div class="info-grid">
            <div class="info-row"><span class="info-label">Thể loại:</span><span class="info-val">${book.TenTheLoai || "Đang cập nhật"}</span></div>
            <div class="info-row"><span class="info-label">Nhà xuất bản:</span><span class="info-val">${book.TenNhaXuatBan || "NXB Văn Học"}</span></div>
            <div class="info-row"><span class="info-label">Năm xuất bản:</span><span class="info-val">${book.NamXuatBan || "2024"}</span></div>
            <div class="info-row"><span class="info-label">Kích thước:</span><span class="info-val">${book.KichThuoc || "14 x 20.5 cm"}</span></div>
        </div>

        <div class="action-area">
            <div class="btn-buy-group">
                <button class="btn-add-cart-lg" onclick="addDetailToCart(${book.SachID})"><i class="fa-solid fa-cart-plus"></i> Thêm vào giỏ</button>
                <button class="btn-buy-now-lg" onclick="buyNow(${book.SachID})">Mua ngay</button>
            </div>
        </div>
    </div>`;
    
    document.getElementById("productMainContent").innerHTML = mainHTML;
}

function renderProductDescription(book) {
    const descContent = book.MoTa ? book.MoTa : `<p>Nội dung mô tả đang cập nhật...</p>`;
    document.getElementById("productDescription").innerHTML = descContent;
}

function renderProductSpecs(book) {
    const specsHTML = `
        <table class="table-specs">
            <tbody>
                <tr><th>Công ty phát hành</th><td>VKD Books Store</td></tr>
                <tr><th>Mã sản phẩm</th><td>BOOK-${book.SachID}</td></tr>
                <tr><th>Tác giả</th><td>${book.TenTacGia || 'Chưa rõ'}</td></tr>
                <tr><th>Thể loại</th><td>${book.TenTheLoai || "Đang cập nhật"}</td></tr>
                <tr><th>Nhà xuất bản</th><td>${book.TenNhaXuatBan || "Đang cập nhật"}</td></tr>
                <tr><th>Năm xuất bản</th><td>${book.NamXuatBan || "Đang cập nhật"}</td></tr>
                <tr><th>Kích thước</th><td>${book.KichThuoc || "14 x 20.5 cm"}</td></tr>
                <tr><th>Trọng lượng</th><td>${book.TrongLuong ? book.TrongLuong + ' gr' : "300 gr"}</td></tr>
            </tbody>
        </table>
    `;
    document.getElementById("productSpecs").innerHTML = specsHTML;
}

async function loadRelatedProducts(cateId) {
    try {
        const url = AppConfig.getUrl(`sach/loc-theo-danh-muc?ids=${cateId}`);
        const res = await fetch(url);
        const data = await res.json();
        if(data.status && data.data) {
            const list = data.data.slice(0, 5); 
            let html = "";
            list.forEach(b => {
                 const imgUrl = b.AnhBia && b.AnhBia.startsWith("http") ? b.AnhBia : `../img/${b.AnhBia}`;
                 html += `
                <div class="product-card">
                    <a href="chitietsanpham.html?id=${b.SachID}" class="card-img-wrap">
                        <img src="${imgUrl}" class="p-img" onerror="this.src='https://via.placeholder.com/200x300'">
                    </a>
                    <a href="chitietsanpham.html?id=${b.SachID}"><h3 class="p-name">${b.TenSach}</h3></a>
                    <div class="card-bottom">
                         <span class="current-price">${formatMoney(b.GiaBan || b.Gia)}</span>
                    </div>
                </div>`;
            });
            document.getElementById('relatedProductsContainer').innerHTML = html;
        }
    } catch(e) {}
}

async function loadReviews(sachId) {
    try {
        const url = AppConfig.getUrl(`review?sach_id=${sachId}`); 
        const res = await fetch(url);
        const data = await res.json();
        if (data.status && data.data) {
            renderReviewList(data.data.reviews);
            if(data.data.stats) renderReviewStats(data.data.stats);
        }
    } catch (e) { console.error("Lỗi tải đánh giá:", e); }
}

function renderReviewStats(stats) {
    if(!stats) return;
    document.getElementById('avgRatingScore').textContent = stats.avg;
    document.getElementById('totalReviewCount').textContent = stats.total;
    const tabBtn = document.getElementById('btnReviewTab');
    if (tabBtn) tabBtn.textContent = `ĐÁNH GIÁ (${stats.total})`;
    let starsHtml = '';
    for(let i=1; i<=5; i++) {
        if(i <= Math.round(stats.avg)) starsHtml += '<i class="fa-solid fa-star"></i>';
        else starsHtml += '<i class="fa-regular fa-star" style="color:#ccc"></i>';
    }
    document.getElementById('avgRatingStars').innerHTML = starsHtml;
    for(let i=1; i<=5; i++) {
        const count = stats.stars ? (stats.stars[i] || 0) : 0;
        const percent = stats.total > 0 ? (count / stats.total * 100) : 0;
        const barEl = document.getElementById(`bar${i}`);
        const countEl = document.getElementById(`count${i}`);
        if(barEl) barEl.style.width = `${percent}%`;
        if(countEl) countEl.textContent = `${Math.round(percent)}%`;
    }
}

function renderReviewList(reviews) {
    const listEl = document.getElementById('reviewList');
    if (!reviews || reviews.length === 0) {
        listEl.innerHTML = '<p style="text-align:center; padding:20px; color:#999">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sách này!</p>';
        return;
    }
    let html = '';
    reviews.forEach(r => {
        let starStr = '';
        for(let i=0; i<5; i++) starStr += i < r.SoSao ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star" style="color:#ddd"></i>';
        const displayName = r.HoTen || "Khách hàng";
        html += `
        <div class="review-item" style="padding: 15px 0; border-bottom: 1px solid #eee;">
            <div class="r-header" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <div>
                    <strong style="font-weight:600">${displayName}</strong>
                    <span style="color:#888; font-size:0.9em; margin-left:10px">${new Date(r.NgayDanhGia).toLocaleDateString('vi-VN')}</span>
                </div>
                <div style="color:#f59e0b">${starStr}</div>
            </div>
            <div class="r-content" style="color:#444; line-height:1.5">${r.BinhLuan}</div>
        </div>`;
    });
    listEl.innerHTML = html;
}