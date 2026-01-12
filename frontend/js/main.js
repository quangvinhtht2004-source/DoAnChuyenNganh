// ================================================================
// 1. BIẾN TOÀN CỤC & KHỞI TẠO
// ================================================================

// Biến chứa dữ liệu tải từ server
let globalSearchData = {
    books: [],
    categories: [],
    authors: [],
    publishers: [] 
};

// Sự kiện khi trang web tải xong
document.addEventListener("DOMContentLoaded", () => {
    setupAuth(); // Thiết lập Auth (Đăng nhập/Đăng xuất)

    // Tải dữ liệu hệ thống trước khi chạy logic chính
    preloadSearchData().then(() => {
        
        loadMegaMenuData();      // Dữ liệu cho Menu Danh mục (Header)
        loadFilterPanelData();   // Dữ liệu cho Bộ lọc ngang (nếu có)
        loadSidebarFilterData(); // <--- MỚI: Dữ liệu cho Sidebar bên trái
        setupFilterToggle();     // Sự kiện nút đóng/mở bộ lọc
        
        // --- LOGIC ĐIỀU HƯỚNG THEO TRANG ---
        const path = window.location.pathname;

        if (path.includes("sachmoi.html")) {
            loadPageSachMoi();
        } 
        else if (path.includes("banchay.html")) {
            loadPageBanChay();
        } 
        else if (path.includes("index.html") || path.endsWith("/")) {
            // Logic riêng cho Trang Chủ
            loadHotSales();     
            loadNewBooks();     
            checkUrlAndFilter(); // Kiểm tra URL để lọc
        }
    });
    
    // Thiết lập sự kiện cho ô tìm kiếm
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Sự kiện nhập liệu -> Hiển thị gợi ý
        searchInput.addEventListener("input", handleSearchInput); 
        
        // Sự kiện bấm Enter -> Chuyển trang tìm kiếm
        searchInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                handleSearch(); 
            }
        });

        // Ẩn gợi ý khi click ra ngoài
        document.addEventListener('click', function(e) {
            const suggestions = document.getElementById('searchSuggestions');
            if (suggestions && !searchInput.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.classList.remove('show');
            }
        });
    }
});


// ================================================================
// 2. LOGIC BỘ LỌC NGANG & SIDEBAR (CẬP NHẬT)
// ================================================================

// Thiết lập sự kiện click cho nút "BỘ LỌC TÌM KIẾM" (Bộ lọc ngang trên Nav)
function setupFilterToggle() {
    const btn = document.getElementById('btnToggleFilter');
    const panel = document.getElementById('filterPanel');
    const arrow = document.getElementById('filterArrow');

    if(btn && panel) {
        btn.addEventListener('click', () => {
            const currentDisplay = window.getComputedStyle(panel).display;
            
            if (currentDisplay === "none") {
                panel.style.display = "block";
                btn.classList.add('active'); 
                if(arrow) arrow.className = "fa-solid fa-chevron-up";
            } else {
                panel.style.display = "none";
                btn.classList.remove('active');
                if(arrow) arrow.className = "fa-solid fa-chevron-down";
            }
        });
    }
}

// Đổ dữ liệu vào 3 cột bộ lọc ngang (nếu có dùng)
function loadFilterPanelData() {
    renderFilterColumn(globalSearchData.categories, "filterCategoryList", "cat");
    renderFilterColumn(globalSearchData.authors, "filterAuthorList", "author");
    renderFilterColumn(globalSearchData.publishers, "filterPublisherList", "pub");
}

// --- HÀM MỚI: ĐỔ DỮ LIỆU VÀO SIDEBAR ---
function loadSidebarFilterData() {
    // Render Thể loại vào Sidebar
    renderSidebarList(globalSearchData.categories, "sidebarCategory", "cat");
    // Render Tác giả vào Sidebar
    renderSidebarList(globalSearchData.authors, "sidebarAuthor", "author");
    // Render NXB vào Sidebar
    renderSidebarList(globalSearchData.publishers, "sidebarPublisher", "pub");
}

// Hàm render danh sách lọc cho Sidebar (tái sử dụng)
function renderSidebarList(dataList, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return; // Nếu không tìm thấy element thì thoát

    if (!dataList || dataList.length === 0) {
        container.innerHTML = '<li style="padding:10px; font-size:12px; color:#999;">Đang cập nhật...</li>';
        return;
    }

    let html = '';
    // Thêm mục "Xem tất cả" đầu tiên
    html += `<li><a href="javascript:void(0)" onclick="quickFilter('${type}', 'all')" style="font-weight:600; color:#FF6600;">Xem tất cả</a></li>`;

    dataList.forEach(item => {
        let name, id;
        if (type === 'cat') { name = item.TenTheLoai; id = item.TheLoaiID; }
        else if (type === 'author') { name = item.TenTacGia; id = item.TacGiaID; }
        else if (type === 'pub') { name = item.TenNhaXuatBan; id = item.NhaXuatBanID; }

        // Mỗi link gọi hàm quickFilter với type và id tương ứng
        html += `<li><a href="javascript:void(0)" onclick="quickFilter('${type}', '${id}')">${name}</a></li>`;
    });
    container.innerHTML = html;
}

// Hàm render danh sách cho bộ lọc ngang (giữ nguyên logic cũ)
function renderFilterColumn(dataList, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!dataList || dataList.length === 0) {
        container.innerHTML = '<li>Đang cập nhật...</li>';
        return;
    }
    let html = `<li><a href="javascript:void(0)" onclick="quickFilter('${type}', 'all')" style="font-weight:700; color:#FF6600;">Xem tất cả</a></li>`;
    dataList.forEach(item => {
        let name, id;
        if (type === 'cat') { name = item.TenTheLoai; id = item.TheLoaiID; }
        else if (type === 'author') { name = item.TenTacGia; id = item.TacGiaID; }
        else if (type === 'pub') { name = item.TenNhaXuatBan; id = item.NhaXuatBanID; }
        html += `<li><a href="javascript:void(0)" onclick="quickFilter('${type}', '${id}')">${name}</a></li>`;
    });
    container.innerHTML = html;
}


// ================================================================
// 3. LOGIC MEGA MENU (MENU DANH MỤC TRÊN THANH NAV)
// ================================================================

function loadMegaMenuData() {
    renderMegaGrid(globalSearchData.categories, "megaCategoryList", "cat");
    renderMegaGrid(globalSearchData.authors, "megaAuthorList", "author");
    renderMegaGrid(globalSearchData.publishers, "megaPublisherList", "pub");
}

function renderMegaGrid(dataList, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let html = '';
    dataList.forEach(item => {
        let name, id;
        if (type === 'cat') { name = item.TenTheLoai; id = item.TheLoaiID; }
        else if (type === 'author') { name = item.TenTacGia; id = item.TacGiaID; }
        else if (type === 'pub') { name = item.TenNhaXuatBan; id = item.NhaXuatBanID; }
        html += `<a href="javascript:void(0)" class="mega-link-item" onclick="quickFilter('${type}', '${id}')">${name}</a>`;
    });
    container.innerHTML = html;
}

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


// ================================================================
// 4. CHỨC NĂNG LỌC SẢN PHẨM (QUICK FILTER - 1 TIÊU CHÍ)
// ================================================================

async function quickFilter(type, value) {
    // Nếu đang ở trang con, chuyển hướng về trang chủ để lọc
    if (!window.location.pathname.includes("index.html") && !window.location.pathname.endsWith("/")) {
        if(type === 'cat') { window.location.href = `index.html?catId=${value}`; } 
        else if(type === 'author') { window.location.href = `index.html?authorId=${value}`; }
        else if(type === 'pub') { window.location.href = `index.html?pubId=${value}`; }
        else if(type === 'all') { window.location.href = `index.html?view=all`; }
        else { window.location.href = `index.html`; }
        return;
    }

    const homeSections = document.getElementById("homeSections");
    const resultSection = document.getElementById("searchResultSection");
    const resultContainer = document.getElementById("searchResultContainer");
    
    // Ẩn nội dung trang chủ, hiện khu vực kết quả lọc
    if(homeSections) homeSections.style.display = "none";
    if(resultSection) resultSection.style.display = "block";
    
    // Cuộn lên đầu phần kết quả
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    resultContainer.innerHTML = `<div style="grid-column:span 5; text-align:center; padding:50px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color:#FF6600"></i><p style="margin-top:10px;">Đang lọc...</p></div>`;

    try {
        let finalBooks = [];
        let filterTitle = "";
        
        // Lấy danh sách tất cả sách từ API (hoặc cache)
        const resBooks = await fetch(AppConfig.getUrl("sach"));
        const dataBooks = await resBooks.json();
        const allBooks = dataBooks.data || [];

        // --- XỬ LÝ LỌC THEO TỪNG TRƯỜNG HỢP (SINGLE CRITERION) ---
        
        if (type === 'cat') { // Lọc theo Danh mục
            if (value === 'all') {
                finalBooks = allBooks;
                filterTitle = "TẤT CẢ DANH MỤC";
            } else {
                finalBooks = allBooks.filter(b => b.TheLoaiID == value);
                
                const catObj = globalSearchData.categories.find(c => c.TheLoaiID == value);
                filterTitle = catObj ? `DANH MỤC: ${catObj.TenTheLoai.toUpperCase()}` : "KẾT QUẢ LỌC";
            }
        } 
        else if (type === 'all') { // Xem tất cả
            finalBooks = allBooks.filter(b => b.TrangThai == 1);
            filterTitle = "TẤT CẢ SẢN PHẨM";
        }
        else if (type === 'author') { // Lọc theo Tác giả
            if (value === 'all') { 
                finalBooks = allBooks; 
                filterTitle = "TẤT CẢ TÁC GIẢ"; 
            } else {
                finalBooks = allBooks.filter(b => b.TacGiaID == value);
                const obj = globalSearchData.authors.find(a => a.TacGiaID == value);
                filterTitle = obj ? `TÁC GIẢ: ${obj.TenTacGia.toUpperCase()}` : "KẾT QUẢ LỌC";
            }
        }
        else if (type === 'pub') { // Lọc theo NXB
            if (value === 'all') { 
                finalBooks = allBooks; 
                filterTitle = "TẤT CẢ NXB"; 
            } else {
                finalBooks = allBooks.filter(b => b.NhaXuatBanID == value);
                const obj = globalSearchData.publishers.find(p => p.NhaXuatBanID == value);
                filterTitle = obj ? `NXB: ${obj.TenNhaXuatBan.toUpperCase()}` : "KẾT QUẢ LỌC";
            }
        }
        else if (type === 'price') { // Lọc theo Giá
            const [minStr, maxStr] = value.split('-');
            const min = parseInt(minStr);
            const max = maxStr === 'max' ? Infinity : parseInt(maxStr);
            
            finalBooks = allBooks.filter(book => {
                // Tính giá bán thực tế (sau khi giảm giá)
                const gia = book.GiaBan || (book.Gia * (1 - (book.PhanTramGiam / 100)));
                return gia >= min && gia < max;
            });
            filterTitle = `GIÁ TỪ ${formatMoney(min)} - ${max === Infinity ? 'TRỞ LÊN' : formatMoney(max)}`;
        }

        // Cập nhật tiêu đề và hiển thị sách
        document.querySelector('.section-title').innerText = `${filterTitle} (${finalBooks.length} sách)`;
        
        if (finalBooks.length > 0) {
            renderBooksToHTML(finalBooks, "searchResultContainer");
        } else {
            resultContainer.innerHTML = `
                <div style="grid-column:span 5; text-align:center; padding: 40px;">
                    <p>Không tìm thấy sách nào.</p>
                    <button onclick="location.reload()" style="padding:5px 15px; margin-top:10px; cursor:pointer;">Xem tất cả</button>
                </div>`;
        }

    } catch (err) {
        console.error(err);
        resultContainer.innerHTML = `<p style="text-align:center; color:red">Có lỗi xảy ra khi tải dữ liệu.</p>`;
    }
}

// Kiểm tra URL để tự động lọc khi vào trang (hỗ trợ share link)
function checkUrlAndFilter() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const catId = urlParams.get('catId');
    const authorId = urlParams.get('authorId');
    const pubId = urlParams.get('pubId');
    const view = urlParams.get('view'); 
    
    if (catId) {
        quickFilter('cat', catId);
    } 
    else if (authorId) {
        quickFilter('author', authorId);
    }
    else if (pubId) {
        quickFilter('pub', pubId);
    }
    else if (view === 'all') { 
        quickFilter('all', 'all');
    }
}


// ================================================================
// 5. CÁC HÀM XỬ LÝ AUTH & TẢI DỮ LIỆU CHUNG
// ================================================================

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
    } catch (err) { console.error("Lỗi tải dữ liệu hệ thống:", err); }
}


// ================================================================
// 6. XỬ LÝ TÌM KIẾM (SEARCH BOX)
// ================================================================

function handleSearchInput(e) {
    const keyword = e.target.value.trim();
    const suggestionBox = document.getElementById('searchSuggestions');
    
    if (keyword.length < 1) { 
        suggestionBox.classList.remove('show'); 
        suggestionBox.innerHTML = '';
        return; 
    }

    const searchKey = removeVietnameseTones(keyword.toLowerCase());
    
    // Tìm Tags liên quan
    let suggestionTags = [];
    globalSearchData.categories.forEach(c => {
        if(removeVietnameseTones(c.TenTheLoai.toLowerCase()).includes(searchKey)) {
            suggestionTags.push({ text: c.TenTheLoai, url: `index.html?catId=${c.TheLoaiID}` });
        }
    });
    globalSearchData.authors.forEach(a => {
        if(removeVietnameseTones(a.TenTacGia.toLowerCase()).includes(searchKey)) {
            suggestionTags.push({ text: a.TenTacGia, url: `index.html?authorId=${a.TacGiaID}` });
        }
    });
    // Giới hạn 6 tags
    suggestionTags = suggestionTags.slice(0, 6);

    // Tìm Sách cụ thể
    let foundBooks = [];
    globalSearchData.books.forEach(b => {
        if(removeVietnameseTones(b.TenSach.toLowerCase()).includes(searchKey)) {
            foundBooks.push(b);
        }
    });
    // Giới hạn 5 sách
    foundBooks = foundBooks.slice(0, 5);

    if (suggestionTags.length === 0 && foundBooks.length === 0) {
        suggestionBox.innerHTML = `<div style="padding:15px; text-align:center; color:#999; font-style:italic;">Không tìm thấy kết quả cho "${keyword}"</div>`;
        suggestionBox.classList.add('show');
        return;
    }

    let htmlContent = '';

    if (suggestionTags.length > 0) {
        htmlContent += `
            <div class="sugg-header"><i class="fa-solid fa-lightbulb"></i> Gợi ý từ khóa</div>
            <div class="sugg-tags-list">
        `;
        suggestionTags.forEach(tag => {
            htmlContent += `<a href="${tag.url}" class="sugg-tag-item">${highlightText(tag.text, keyword)}</a>`;
        });
        htmlContent += `</div>`;
    }

    if (foundBooks.length > 0) {
        htmlContent += `
            <div class="sugg-header"><i class="fa-solid fa-book"></i> Sản phẩm phù hợp</div>
            <div class="sugg-product-list">
        `;
        foundBooks.forEach(book => {
            const imgUrl = book.AnhBia && book.AnhBia.startsWith("http") ? book.AnhBia : `../img/${book.AnhBia}`;
            const giaBan = book.GiaBan || (book.Gia * (1 - (book.PhanTramGiam/100)));
            htmlContent += `
                <a href="chitietsanpham.html?id=${book.SachID}" class="sugg-product-item">
                    <img src="${imgUrl}" class="sugg-thumb" onerror="this.src='https://via.placeholder.com/50x70'">
                    <div class="sugg-info">
                        <div class="sugg-name">${highlightText(book.TenSach, keyword)}</div>
                        <div class="sugg-price">${formatMoney(giaBan)}</div>
                    </div>
                </a>
            `;
        });
        htmlContent += `</div>`;
    }
    suggestionBox.innerHTML = htmlContent;
    suggestionBox.classList.add('show');
}

async function handleSearch() {
    const keyword = document.getElementById('searchInput').value.trim();
    if (!keyword) return;
    
    const suggestionBox = document.getElementById('searchSuggestions');
    if(suggestionBox) suggestionBox.classList.remove('show');
    
    if(!document.getElementById("searchResultContainer")) { 
        window.location.href = "index.html"; 
        return; 
    }

    const homeSections = document.getElementById("homeSections");
    const resultSection = document.getElementById("searchResultSection");
    
    if(homeSections) homeSections.style.display = "none";
    if(resultSection) resultSection.style.display = "block";

    const searchKey = removeVietnameseTones(keyword.toLowerCase());

    const foundBooks = globalSearchData.books.filter(book => {
        const nameMatch = removeVietnameseTones(book.TenSach.toLowerCase()).includes(searchKey);
        
        const authorObj = globalSearchData.authors.find(a => a.TacGiaID == book.TacGiaID);
        const authorMatch = authorObj ? removeVietnameseTones(authorObj.TenTacGia.toLowerCase()).includes(searchKey) : false;

        const catObj = globalSearchData.categories.find(c => c.TheLoaiID == book.TheLoaiID);
        const catMatch = catObj ? removeVietnameseTones(catObj.TenTheLoai.toLowerCase()).includes(searchKey) : false;

        return nameMatch || authorMatch || catMatch;
    });
    
    document.querySelector('.section-title').innerText = `KẾT QUẢ TÌM KIẾM: "${keyword}" (${foundBooks.length} sách)`;
    
    if (foundBooks.length > 0) {
        renderBooksToHTML(foundBooks, "searchResultContainer");
    } else {
        document.getElementById("searchResultContainer").innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p>Không tìm thấy sách nào phù hợp với từ khóa <strong>"${keyword}"</strong>.</p>
                <button onclick="location.reload()" style="padding: 8px 20px; margin-top: 10px; cursor: pointer;">Xem tất cả sách</button>
            </div>
        `;
    }
}


// ================================================================
// 7. CÁC HÀM TẢI DỮ LIỆU TRANG CHỦ & TRANG CON
// ================================================================

async function loadHotSales() {
    const res = await fetch(AppConfig.getUrl("sach/ban-chay"));
    const data = await res.json();
    if (data.status) renderBooksToHTML(data.data.slice(0, 5), "bestSalesContainer");
}

async function loadNewBooks() {
    const res = await fetch(AppConfig.getUrl("sach/moi"));
    const data = await res.json();
    if (data.status) renderBooksToHTML(data.data.slice(0, 5), "newBooksContainer");
}

async function loadPageSachMoi() {
    const res = await fetch(AppConfig.getUrl("sach/moi"));
    const data = await res.json();
    if (data.status) renderBooksToHTML(data.data.slice(0, 20), "fullNewBooksContainer");
}

async function loadPageBanChay() {
    const res = await fetch(AppConfig.getUrl("sach/ban-chay"));
    const data = await res.json();
    if (data.status) renderBooksToHTML(data.data.slice(0, 20), "fullHotBooksContainer");
}

function renderBooksToHTML(list, containerId) {
    const box = document.getElementById(containerId);
    if (!box || !list.length) return;
    
    let html = "";
    list.forEach(book => {
        const imgUrl = book.AnhBia && book.AnhBia.startsWith("http") ? book.AnhBia : `../img/${book.AnhBia}`;
        const gia = book.GiaBan || (book.Gia * (1 - (book.PhanTramGiam/100)));
        const stock = parseInt(book.SoLuong || 0);
        
        let catName = book.TenTheLoai;
        if ((!catName || catName === "") && globalSearchData.categories.length > 0) {
            const catObj = globalSearchData.categories.find(c => c.TheLoaiID == book.TheLoaiID);
            if (catObj) catName = catObj.TenTheLoai;
        }
        if (!catName) catName = "Đang cập nhật";

        let pubName = book.TenNhaXuatBan;
        if ((!pubName || pubName === "") && globalSearchData.publishers.length > 0) {
            const pubObj = globalSearchData.publishers.find(p => p.NhaXuatBanID == book.NhaXuatBanID);
            if (pubObj) pubName = pubObj.TenNhaXuatBan;
        }
        if (!pubName) pubName = "Đang cập nhật";

        let btn = (stock > 0 && book.TrangThai == 1) 
            ? `<button class="btn-add-cart-mini" onclick="addToCartCheck(${book.SachID}, ${stock})"><i class="fa-solid fa-cart-shopping"></i></button>`
            : `<button class="btn-add-cart-mini" disabled style="background:#ccc"><i class="fa-solid fa-ban"></i></button>`;

        html += `
        <div class="product-card" style="height: auto; min-height: 480px; display: flex; flex-direction: column;">
            ${book.PhanTramGiam > 0 ? `<span class="badge-sale">-${book.PhanTramGiam}%</span>` : ""}
            <a href="chitietsanpham.html?id=${book.SachID}" class="card-img-wrap" style="flex-shrink:0;">
                <img src="${imgUrl}" class="p-img" onerror="this.src='https://via.placeholder.com/200x300'">
            </a>
            
            <div style="flex-grow:1; padding:0 10px; display:flex; flex-direction:column;">
                <a href="chitietsanpham.html?id=${book.SachID}"><h3 class="p-name" style="height:40px; overflow:hidden;">${book.TenSach}</h3></a>
                
                <div class="p-meta" style="color:#555; font-size:0.8rem; flex-grow:1;">
                    <div class="p-meta-item" style="margin-bottom:4px;">
                        <i class="fa-solid fa-pen-nib" style="color:#FF6600"></i> ${book.TenTacGia || "..."}
                    </div>
                    <div class="p-meta-item" style="margin-bottom:4px;">
                        <i class="fa-solid fa-bookmark" style="color:#FF6600"></i> ${catName}
                    </div>
                    <div class="p-meta-item">
                        <i class="fa-solid fa-building" style="color:#FF6600"></i> ${pubName}
                    </div>
                </div>
            </div>

            <div class="card-bottom" style="margin-top:auto; padding:10px; border-top:1px solid #eee;">
                <div class="price-wrap">
                    <span class="current-price">${formatMoney(gia)}</span>
                    ${book.PhanTramGiam > 0 ? `<span class="old-price" style="font-size:0.8rem">${formatMoney(book.Gia)}</span>` : ""}
                </div>
                ${btn}
            </div>
        </div>`;
    });
    box.innerHTML = html;
}


// ================================================================
// 8. TIỆN ÍCH (UTILS)
// ================================================================

function highlightText(text, key) { 
    if(!text) return ""; 
    return text.replace(new RegExp(`(${key})`, 'gi'), '<span class="highlight-text">$1</span>'); 
}

function removeVietnameseTones(str) { 
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D'); 
}

function formatMoney(n) { 
    return Number(n).toLocaleString("vi-VN") + "đ"; 
}

function addToCartCheck(id, stock) { 
    if(stock<=0) return alert("Hết hàng"); 
    addToCartAndRedirect(id); 
}

async function addToCartAndRedirect(id) { 
    const userJson = localStorage.getItem("user");
    if(!userJson) { 
        if(confirm("Cần đăng nhập?")) window.location.href="dangnhap.html"; 
        return; 
    }
    const user = JSON.parse(userJson);
    try {
        const res = await fetch(AppConfig.getUrl("gio-hang/them"), { 
            method:"POST", 
            headers:{"Content-Type":"application/json"}, 
            body:JSON.stringify({UserID:user.UserID, SachID:id, SoLuong:1}) 
        });
        const data = await res.json();
        if(data.status) { 
            alert("Thêm thành công"); 
            if(typeof updateCartBadge === 'function') updateCartBadge(); 
        } else {
            alert(data.message || "Lỗi");
        }
    } catch(e) { console.error(e); }
}

// ================================================================
// 9. LOGIC ACCORDION SIDEBAR (MỚI)
// ================================================================

function toggleFilter(btn) {
    // 1. Tìm phần nội dung ngay sau nút bấm
    const content = btn.nextElementSibling;
    
    // 2. Kiểm tra trạng thái hiện tại (nếu đang ẩn hoặc chưa set display thì coi là đóng)
    const isOpening = content.style.display === "none" || content.style.display === "";

    // 3. Đóng tất cả các tab khác (giữ sidebar gọn gàng)
    const allContents = document.querySelectorAll('.accordion-content');
    const allBtns = document.querySelectorAll('.accordion-btn');
    
    allContents.forEach(div => div.style.display = 'none');
    allBtns.forEach(b => b.classList.remove('active'));

    // 4. Mở hoặc đóng tab hiện tại
    if (isOpening) {
        content.style.display = "block";
        btn.classList.add("active");
    } else {
        content.style.display = "none";
        btn.classList.remove("active");
    }
}