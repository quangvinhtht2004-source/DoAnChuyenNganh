// Biến toàn cục chứa dữ liệu
let globalSearchData = {
    books: [],
    categories: [],
    authors: [],
    publishers: [] 
};

document.addEventListener("DOMContentLoaded", () => {
    setupAuth(); // Thiết lập Auth chung cho mọi trang

    // Tải dữ liệu ban đầu (Tác giả, thể loại...) trước khi render
    preloadSearchData().then(() => {
        
        // --- GỌI HÀM LOAD DỮ LIỆU VÀO MEGA MENU (Chạy mọi trang) ---
        loadMegaMenuData(); 
        
        // --- LOGIC ROUTING (QUAN TRỌNG: Kiểm tra trang hiện tại) ---
        const path = window.location.pathname;

        if (path.includes("sachmoi.html")) {
            // Nếu đang ở trang Sách Mới -> Load 20 cuốn mới
            loadPageSachMoi();
        } 
        else if (path.includes("banchay.html")) {
            // Nếu đang ở trang Bán Chạy -> Load 20 cuốn bán chạy
            loadPageBanChay();
        } 
        else if (path.includes("index.html") || path.endsWith("/")) {
            // Nếu đang ở Trang Chủ -> Load layout trang chủ
            loadHotSales();     // Load 5 cuốn bán chạy
            loadNewBooks();     // Load 5 cuốn mới
            checkUrlAndFilter(); // Kiểm tra filter URL
        }
        // Các trang khác (chi tiết, giỏ hàng) tự có logic riêng hoặc không cần load list sách
    });
    
    // Sự kiện tìm kiếm (Chạy mọi trang)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener("input", handleSearchInput); 
        searchInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                handleSearch(); 
            }
        });
        document.addEventListener('click', function(e) {
            const suggestions = document.getElementById('searchSuggestions');
            if (suggestions && !searchInput.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.classList.remove('show');
            }
        });
    }
});

/* ==================================================================
   PHẦN 1: LOGIC MEGA MENU
   ================================================================== */

// 1. Hàm chuyển Tab khi rê chuột vào Sidebar
function openFilterTab(evt, tabName) {
    var tabContent = document.getElementsByClassName("menu-tab-content");
    for (var i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
        tabContent[i].classList.remove("active");
    }

    var menuItems = document.querySelectorAll(".mega-menu-sidebar .menu-item");
    for (var i = 0; i < menuItems.length; i++) {
        menuItems[i].classList.remove("active");
    }

    const selectedTab = document.getElementById(tabName);
    if(selectedTab) {
        selectedTab.style.display = "block";
        selectedTab.classList.add("active");
    }
    evt.currentTarget.classList.add("active");
}

// 2. Load dữ liệu vào các Tab
function loadMegaMenuData() {
    renderMegaGrid(globalSearchData.categories, "megaCategoryList", "cat");
    renderMegaGrid(globalSearchData.authors, "megaAuthorList", "author");
    renderMegaGrid(globalSearchData.publishers, "megaPublisherList", "pub");
}

// Hàm render danh sách dạng dọc
function renderMegaGrid(dataList, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!dataList || dataList.length === 0) {
        container.innerHTML = '<p class="loading-text">Chưa có dữ liệu</p>';
        return;
    }

    let html = '';
    dataList.forEach(item => {
        let name, id;
        if (type === 'cat') { name = item.TenTheLoai; id = item.TheLoaiID; }
        else if (type === 'author') { name = item.TenTacGia; id = item.TacGiaID; }
        else if (type === 'pub') { name = item.TenNhaXuatBan; id = item.NhaXuatBanID; }

        html += `<a href="javascript:void(0)" class="mega-link-item" onclick="quickFilter('${type}', '${id}')">
                    ${name}
                 </a>`;
    });
    container.innerHTML = html;
}

// 3. HÀM LỌC SẢN PHẨM KHI CLICK
async function quickFilter(type, value) {
    // Nếu đang ở trang con (sachmoi/banchay), chuyển về index để lọc
    if (!window.location.pathname.includes("index.html") && !window.location.pathname.endsWith("/")) {
        // Chuyển hướng về trang chủ kèm tham số (nếu cần xử lý phức tạp hơn thì dùng localStorage)
        // Ở đây demo đơn giản: nếu type là cat thì chuyển link, còn lại reload về index
        if(type === 'cat') {
            window.location.href = `index.html?catId=${value}`;
            return;
        } else {
            // Với các loại khác, tạm thời chuyển về index (cần nâng cấp logic nếu muốn lọc author từ trang con)
            window.location.href = `index.html`; 
            return;
        }
    }

    const homeSections = document.getElementById("homeSections");
    const resultSection = document.getElementById("searchResultSection");
    const resultContainer = document.getElementById("searchResultContainer");
    
    if(homeSections) homeSections.style.display = "none";
    if(resultSection) resultSection.style.display = "block";
    
    resultContainer.innerHTML = `
        <div style="grid-column:span 5; text-align:center; padding:50px;">
            <i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color:#FF6600"></i>
            <p style="margin-top:10px; color:#666">Đang tìm kiếm sách...</p>
        </div>`;

    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        let finalBooks = [];
        let filterTitle = "";
        
        if (type === 'cat') {
            if (value === 'all') {
                const res = await fetch(AppConfig.getUrl("sach"));
                const data = await res.json();
                finalBooks = data.data || [];
                filterTitle = "TẤT CẢ DANH MỤC";
            } else {
                const res = await fetch(AppConfig.getUrl(`sach/loc-theo-danh-muc?ids=${value}`));
                const data = await res.json();
                finalBooks = data.data || [];
                const catObj = globalSearchData.categories.find(c => c.TheLoaiID == value);
                filterTitle = catObj ? `DANH MỤC: ${catObj.TenTheLoai.toUpperCase()}` : "KẾT QUẢ LỌC";
            }
        } 
        else {
            const res = await fetch(AppConfig.getUrl("sach"));
            const data = await res.json();
            const allBooks = data.data || [];

            if (type === 'author') {
                if (value === 'all') { finalBooks = allBooks; filterTitle = "TẤT CẢ TÁC GIẢ"; }
                else {
                    finalBooks = allBooks.filter(b => b.TacGiaID == value);
                    const obj = globalSearchData.authors.find(a => a.TacGiaID == value);
                    filterTitle = obj ? `TÁC GIẢ: ${obj.TenTacGia.toUpperCase()}` : "KẾT QUẢ LỌC";
                }
            }
            else if (type === 'pub') {
                if (value === 'all') { finalBooks = allBooks; filterTitle = "TẤT CẢ NXB"; }
                else {
                    finalBooks = allBooks.filter(b => b.NhaXuatBanID == value);
                    const obj = globalSearchData.publishers.find(p => p.NhaXuatBanID == value);
                    filterTitle = obj ? `NXB: ${obj.TenNhaXuatBan.toUpperCase()}` : "KẾT QUẢ LỌC";
                }
            }
            else if (type === 'price') {
                const [minStr, maxStr] = value.split('-');
                const min = parseInt(minStr);
                const max = maxStr === 'max' ? Infinity : parseInt(maxStr);
                
                finalBooks = allBooks.filter(book => {
                    const gia = book.GiaBan || (book.Gia * (1 - (book.PhanTramGiam / 100)));
                    return gia >= min && gia < max;
                });
                filterTitle = "KẾT QUẢ LỌC THEO GIÁ";
            }
            else { 
                finalBooks = allBooks;
                filterTitle = "TẤT CẢ SẢN PHẨM";
            }
        }

        document.querySelector('.section-title').innerText = `${filterTitle} (${finalBooks.length} sách)`;
        
        if (finalBooks.length > 0) {
            renderBooksToHTML(finalBooks, "searchResultContainer");
        } else {
            resultContainer.innerHTML = `
                <div style="grid-column:span 5; text-align:center; padding: 40px;">
                    <i class="fa-solid fa-box-open" style="font-size:40px; color:#ddd; margin-bottom:15px;"></i>
                    <p>Không tìm thấy sách nào phù hợp.</p>
                    <button onclick="location.reload()" style="margin-top:10px; padding:5px 15px; cursor:pointer; background:#333; color:white; border:none; border-radius:4px;">Xem tất cả</button>
                </div>`;
        }

    } catch (err) {
        console.error(err);
        resultContainer.innerHTML = `<p style="text-align:center; color:red">Có lỗi xảy ra.</p>`;
    }
}

// Xử lý URL Param
function checkUrlAndFilter() {
    const urlParams = new URLSearchParams(window.location.search);
    const catId = urlParams.get('catId');
    if (catId) {
        quickFilter('cat', catId);
    }
}

/* ==================================================================
   PHẦN 2: CÁC HÀM CƠ BẢN & AUTH
   ================================================================== */

function setupAuth() {
    const loginBtnGroup = document.getElementById('loginBtn');       
    const userInfoGroup = document.getElementById('userInfoContainer'); 
    const userNameSpan = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');

    const userJson = localStorage.getItem("user");

    if (userJson) {
        const user = JSON.parse(userJson);
        if(loginBtnGroup) loginBtnGroup.style.display = 'none';
        if(userInfoGroup) userInfoGroup.style.display = 'block';
        if(userNameSpan) userNameSpan.textContent = user.HoTen || user.TenDangNhap || "Khách hàng";
    } else {
        if(loginBtnGroup) loginBtnGroup.style.display = 'flex'; 
        if(userInfoGroup) userInfoGroup.style.display = 'none';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault(); 
            localStorage.removeItem("user");
            alert("Đăng xuất thành công!");
            if(userInfoGroup) userInfoGroup.style.display = 'none';
            if(loginBtnGroup) loginBtnGroup.style.display = 'flex';
            const cartBadge = document.getElementById('cartBadge');
            if(cartBadge) cartBadge.textContent = '0';
            window.location.href = "index.html";
        });
    }
}

async function preloadSearchData() {
    try {
        const [resBooks, resCats, resAuthors, resPubs] = await Promise.all([
            fetch(AppConfig.getUrl("sach")),
            fetch(AppConfig.getUrl("theloai")),
            fetch(AppConfig.getUrl("tacgia")),
            fetch(AppConfig.getUrl("nhaxuatban"))
        ]);

        const dataBooks = await resBooks.json();
        const dataCats = await resCats.json();
        const dataAuthors = await resAuthors.json();
        const dataPubs = await resPubs.json();

        if (dataBooks.status) globalSearchData.books = dataBooks.data;
        if (dataCats.status) globalSearchData.categories = dataCats.data;
        if (dataAuthors.status) globalSearchData.authors = dataAuthors.data;
        if (dataPubs.status) globalSearchData.publishers = dataPubs.data;

    } catch (err) {
        console.error("Lỗi tải dữ liệu hệ thống:", err);
    }
}

// Xử lý Search Box
function handleSearchInput(e) {
    const keyword = e.target.value.trim();
    const suggestionBox = document.getElementById('searchSuggestions');
    
    if (keyword.length < 1) {
        suggestionBox.classList.remove('show');
        suggestionBox.innerHTML = '';
        return;
    }

    const searchKey = removeVietnameseTones(keyword.toLowerCase());
    const matchedCats = globalSearchData.categories.filter(cat => removeVietnameseTones(cat.TenTheLoai.toLowerCase()).includes(searchKey));
    const matchedBooks = globalSearchData.books.filter(book => {
        const nameMatch = removeVietnameseTones(book.TenSach.toLowerCase()).includes(searchKey);
        const authorObj = globalSearchData.authors.find(a => a.TacGiaID == book.TacGiaID);
        const authorName = authorObj ? removeVietnameseTones(authorObj.TenTacGia.toLowerCase()) : "";
        return nameMatch || authorName.includes(searchKey);
    }).slice(0, 5);

    let html = '';
    if (matchedCats.length > 0) {
        html += `<div class="suggestion-group"><div class="suggestion-group-title">Danh mục</div>`;
        matchedCats.forEach(cat => {
            html += `<a href="index.html?catId=${cat.TheLoaiID}" class="suggestion-item"><i class="fa-solid fa-folder-open" style="color:#999; width:20px;"></i><span>${highlightText(cat.TenTheLoai, keyword)}</span></a>`;
        });
        html += `</div>`;
    }
    if (matchedBooks.length > 0) {
        html += `<div class="suggestion-group"><div class="suggestion-group-title">Sách</div>`;
        matchedBooks.forEach(book => {
            const imgUrl = book.AnhBia && book.AnhBia !== "null" ? (book.AnhBia.startsWith("http") ? book.AnhBia : `../img/${book.AnhBia}`) : "https://via.placeholder.com/200x300";
            const authorObj = globalSearchData.authors.find(a => a.TacGiaID == book.TacGiaID);
            const authorName = authorObj ? authorObj.TenTacGia : "Đang cập nhật";
            html += `<a href="chitietsanpham.html?id=${book.SachID}" class="suggestion-item"><img src="${imgUrl}" class="sugg-img"><div class="sugg-info"><h4>${highlightText(book.TenSach, keyword)}</h4><span>${authorName}</span></div></a>`;
        });
        html += `</div>`;
    }
    if (matchedCats.length === 0 && matchedBooks.length === 0) {
        html = `<div style="padding:15px; text-align:center; color:#999; font-size:13px;">Không tìm thấy kết quả phù hợp</div>`;
    }
    suggestionBox.innerHTML = html;
    suggestionBox.classList.add('show');
}

async function handleSearch() {
    const keyword = document.getElementById('searchInput').value.trim();
    if (!keyword) { alert("Vui lòng nhập từ khóa!"); return; }
    document.getElementById('searchSuggestions').classList.remove('show');

    // Nếu không ở trang chủ, chuyển về trang chủ (hoặc xử lý hiển thị ở trang hiện tại nếu có container)
    const resultContainer = document.getElementById("searchResultContainer");
    
    // Nếu trang hiện tại KHÔNG có container kết quả (ví dụ trang chi tiết), chuyển về index
    if (!resultContainer) {
         // Thực tế nên lưu keyword vào storage rồi chuyển trang, ở đây báo tạm
         alert("Đang chuyển về trang chủ để tìm kiếm...");
         window.location.href = "index.html";
         return;
    }

    const homeSections = document.getElementById("homeSections");
    const resultSection = document.getElementById("searchResultSection");
    
    if(homeSections) homeSections.style.display = "none";
    if(resultSection) resultSection.style.display = "block";
    resultContainer.innerHTML = '<div style="grid-column:span 5; text-align:center; padding:50px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i><p>Đang tìm kiếm...</p></div>';

    const searchKey = removeVietnameseTones(keyword.toLowerCase());
    const matchedCatIds = globalSearchData.categories.filter(c => removeVietnameseTones(c.TenTheLoai.toLowerCase()).includes(searchKey)).map(c => c.TheLoaiID);
    const matchedAuthorIds = globalSearchData.authors.filter(a => removeVietnameseTones(a.TenTacGia.toLowerCase()).includes(searchKey)).map(a => a.TacGiaID);

    const foundBooks = globalSearchData.books.filter(book => {
        const nameMatch = removeVietnameseTones(book.TenSach.toLowerCase()).includes(searchKey);
        const catMatch = matchedCatIds.includes(book.TheLoaiID);
        const authorMatch = matchedAuthorIds.includes(book.TacGiaID);
        return nameMatch || catMatch || authorMatch;
    });

    document.querySelector('.section-title').innerText = `KẾT QUẢ TÌM KIẾM: "${keyword}" (${foundBooks.length} sách)`;
    if (foundBooks.length > 0) renderBooksToHTML(foundBooks, "searchResultContainer");
    else resultContainer.innerHTML = `<div style="grid-column:span 5; text-align:center; padding: 60px;"><p>Không tìm thấy sản phẩm nào.</p><button onclick="location.reload()" style="margin-top:10px; padding:8px 15px; cursor:pointer;">Quay lại</button></div>`;
}

// Load sách Home Page (Chỉ gọi ở index.html)
async function loadHotSales() {
    try {
        const res = await fetch(AppConfig.getUrl("sach/ban-chay"));
        const data = await res.json();
        // Lấy 5 cuốn cho trang chủ
        if (data.status && data.data) renderBooksToHTML(data.data.slice(0, 5), "bestSalesContainer");
    } catch (err) { console.error(err); }
}
async function loadNewBooks() {
    try {
        const res = await fetch(AppConfig.getUrl("sach/moi"));
        const data = await res.json();
        // Lấy 5 cuốn cho trang chủ
        if (data.status && data.data) renderBooksToHTML(data.data.slice(0, 5), "newBooksContainer");
    } catch (err) { console.error(err); }
}

// Render sách ra HTML (Dùng chung)
function renderBooksToHTML(list, containerId) {
    const box = document.getElementById(containerId);
    if (!box) return;
    if (!list || list.length === 0) return;

    let html = "";
    list.forEach(book => {
        const imgUrl = book.AnhBia && book.AnhBia !== "null" ? (book.AnhBia.startsWith("http") ? book.AnhBia : `../img/${book.AnhBia}`) : "https://via.placeholder.com/200x300";
        let tacGia = book.TenTacGia || "Chưa cập nhật";
        if (!book.TenTacGia && globalSearchData.authors.length > 0) {
             const a = globalSearchData.authors.find(au => au.TacGiaID == book.TacGiaID);
             if(a) tacGia = a.TenTacGia;
        }
        let theLoai = book.TenTheLoai || "Khác";
        if (!book.TenTheLoai && globalSearchData.categories.length > 0) {
            const c = globalSearchData.categories.find(cat => cat.TheLoaiID == book.TheLoaiID);
            if(c) theLoai = c.TenTheLoai;
        }

        const soLuongTon = parseInt(book.SoLuong || 0);
        const trangThai = parseInt(book.TrangThai); 
        let btnCartHtml = '';
        if (soLuongTon <= 0 || trangThai === 2) btnCartHtml = `<button class="btn-add-cart-mini" disabled style="background:#ccc; cursor:not-allowed;" title="Hết hàng"><i class="fa-solid fa-ban"></i></button>`;
        else if (trangThai === 0) btnCartHtml = `<button class="btn-add-cart-mini" disabled style="background:#ccc; cursor:not-allowed;" title="Ngừng kinh doanh"><i class="fa-solid fa-lock"></i></button>`;
        else btnCartHtml = `<button class="btn-add-cart-mini" onclick="addToCartCheck(${book.SachID}, ${soLuongTon})" title="Thêm vào giỏ"><i class="fa-solid fa-cart-shopping"></i></button>`;

        html += `
        <div class="product-card" style="height: auto; min-height: 420px;">
            ${book.PhanTramGiam > 0 ? `<span class="badge-sale">-${book.PhanTramGiam}%</span>` : ""}
            <a href="chitietsanpham.html?id=${book.SachID}" class="card-img-wrap">
                <img src="${imgUrl}" class="p-img" onerror="this.src='https://via.placeholder.com/200x300'">
            </a>
            <a href="chitietsanpham.html?id=${book.SachID}">
                <h3 class="p-name" title="${book.TenSach}" style="margin-bottom: 5px;">${book.TenSach}</h3>
            </a>
            <div class="p-meta" style="font-size: 0.85rem; color: #666; line-height: 1.6; margin-bottom: 10px;">
                 <div class="p-meta-item" title="Tác giả"><i class="fa-solid fa-pen-nib" style="width:15px; text-align:center;"></i> <strong>${tacGia}</strong></div>
                 <div class="p-meta-item" title="Thể loại"><i class="fa-solid fa-book" style="width:15px; text-align:center;"></i> <span>${theLoai}</span></div>
            </div>
            <div class="card-bottom" style="margin-top: auto;">
                <div class="price-wrap">
                    <span class="current-price">${formatMoney(book.GiaBan || book.Gia * (1 - (book.PhanTramGiam/100)))}</span>
                    ${book.PhanTramGiam > 0 ? `<span class="old-price">${formatMoney(book.Gia)}</span>` : ""}
                </div>
                ${btnCartHtml}
            </div>
        </div>`;
    });
    box.innerHTML = html;
}

// Tiện ích
function highlightText(text, keyword) { if(!text) return ""; const regex = new RegExp(`(${keyword})`, 'gi'); return text.replace(regex, '<span class="highlight-text">$1</span>'); }
function removeVietnameseTones(str) { str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); str = str.replace(/đ/g,"d"); str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A"); str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E"); str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I"); str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O"); str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U"); str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y"); str = str.replace(/Đ/g, "D"); str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); str = str.replace(/\u02C6|\u0306|\u031B/g, ""); str = str.replace(/ + /g," "); str = str.trim(); return str; }
function formatMoney(num) { return Number(num).toLocaleString("vi-VN") + "đ"; }
function addToCartCheck(sachId, stock) { if (stock <= 0) { alert("Sản phẩm này đã hết hàng!"); return; } addToCartAndRedirect(sachId); }
async function addToCartAndRedirect(sachId) {
    const userJson = localStorage.getItem("user");
    if (!userJson) { if(confirm("Bạn cần đăng nhập để thêm sản phẩm vào giỏ. Đi đến trang đăng nhập?")) window.location.href = "dangnhap.html"; return; }
    const user = JSON.parse(userJson);
    try {
        const res = await fetch(AppConfig.getUrl("gio-hang/them"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ UserID: user.UserID, SachID: sachId, SoLuong: 1 }) });
        const data = await res.json();
        if (data.status) { alert("Đã thêm sản phẩm vào giỏ hàng thành công!"); if (typeof updateCartBadge === 'function') updateCartBadge(); } else alert(data.message || "Lỗi: Không thể thêm vào giỏ hàng.");
    } catch (err) { console.error(err); alert("Lỗi kết nối đến server!"); }
}

/* ==================================================================
   PHẦN BỔ SUNG: LOAD TRANG RIÊNG (20 SÁCH)
   ================================================================== */

// Hàm dùng cho trang sachmoi.html (Load 20 sách)
async function loadPageSachMoi() {
    if (globalSearchData.authors.length === 0) await preloadSearchData();

    try {
        const res = await fetch(AppConfig.getUrl("sach/moi"));
        const data = await res.json();
        
        if (data.status && data.data) {
            const list20 = data.data.slice(0, 20); // Lấy 20 cuốn
            renderBooksToHTML(list20, "fullNewBooksContainer");
        } else {
            const container = document.getElementById("fullNewBooksContainer");
            if(container) container.innerHTML = '<p>Không có dữ liệu.</p>';
        }
    } catch (err) {
        console.error(err);
        const container = document.getElementById("fullNewBooksContainer");
        if(container) container.innerHTML = '<p style="color:red">Lỗi tải dữ liệu.</p>';
    }
}

// Hàm dùng cho trang banchay.html (Load 20 sách)
async function loadPageBanChay() {
    if (globalSearchData.authors.length === 0) await preloadSearchData();

    try {
        const res = await fetch(AppConfig.getUrl("sach/ban-chay"));
        const data = await res.json();
        
        if (data.status && data.data) {
            const list20 = data.data.slice(0, 20); // Lấy 20 cuốn
            renderBooksToHTML(list20, "fullHotBooksContainer");
        } else {
            const container = document.getElementById("fullHotBooksContainer");
            if(container) container.innerHTML = '<p>Không có dữ liệu.</p>';
        }
    } catch (err) {
        console.error(err);
        const container = document.getElementById("fullHotBooksContainer");
        if(container) container.innerHTML = '<p style="color:red">Lỗi tải dữ liệu.</p>';
    }
}