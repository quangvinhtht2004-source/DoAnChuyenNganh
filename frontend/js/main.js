// Biến toàn cục chứa dữ liệu tìm kiếm và tham chiếu (Lookup data)
let globalSearchData = {
    books: [],
    categories: [],
    authors: [],
    publishers: [] 
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Cài đặt Logic Đăng nhập / Đăng xuất
    setupAuth();

    // 2. Tải dữ liệu tham chiếu
    preloadSearchData().then(() => {
        loadHotSales();
        loadNewBooks();
    });
    
    loadCategories(); 
    
    // Sự kiện nhập liệu tìm kiếm
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
            if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.classList.remove('show');
            }
        });
    }
});

/* ==================================================================
   PHẦN 0: LOGIC AUTH (ĐĂNG NHẬP / ĐĂNG XUẤT)
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

/* ==================================================================
   PHẦN 1: TÌM KIẾM & DỮ LIỆU THAM CHIẾU
   ================================================================== */

// 1. Tải trước dữ liệu
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
        console.error("Lỗi tải dữ liệu tìm kiếm:", err);
    }
}

// 2. Xử lý khi gõ phím (Hiện gợi ý)
function handleSearchInput(e) {
    const keyword = e.target.value.trim();
    const suggestionBox = document.getElementById('searchSuggestions');
    
    if (keyword.length < 1) {
        suggestionBox.classList.remove('show');
        suggestionBox.innerHTML = '';
        return;
    }

    const searchKey = removeVietnameseTones(keyword.toLowerCase());

    const matchedCats = globalSearchData.categories.filter(cat => 
        removeVietnameseTones(cat.TenTheLoai.toLowerCase()).includes(searchKey)
    );

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
            html += `<a href="index.html?catId=${cat.TheLoaiID}" class="suggestion-item">
                        <i class="fa-solid fa-folder-open" style="color:#999; width:20px;"></i>
                        <span>${highlightText(cat.TenTheLoai, keyword)}</span>
                     </a>`;
        });
        html += `</div>`;
    }

    if (matchedBooks.length > 0) {
        html += `<div class="suggestion-group"><div class="suggestion-group-title">Sách</div>`;
        matchedBooks.forEach(book => {
            const imgUrl = book.AnhBia && book.AnhBia !== "null" 
                ? (book.AnhBia.startsWith("http") ? book.AnhBia : `../img/${book.AnhBia}`) 
                : "https://via.placeholder.com/200x300";
            const authorObj = globalSearchData.authors.find(a => a.TacGiaID == book.TacGiaID);
            const authorName = authorObj ? authorObj.TenTacGia : "Đang cập nhật";

            html += `<a href="chitietsanpham.html?id=${book.SachID}" class="suggestion-item">
                        <img src="${imgUrl}" class="sugg-img" onerror="this.src='https://via.placeholder.com/50x70'">
                        <div class="sugg-info">
                            <h4>${highlightText(book.TenSach, keyword)}</h4>
                            <span>${authorName}</span>
                        </div>
                     </a>`;
        });
        html += `</div>`;
    }

    if (matchedCats.length === 0 && matchedBooks.length === 0) {
        html = `<div style="padding:15px; text-align:center; color:#999; font-size:13px;">Không tìm thấy kết quả phù hợp</div>`;
    }

    suggestionBox.innerHTML = html;
    suggestionBox.classList.add('show');
}

// 3. Hàm xử lý tìm kiếm Full
async function handleSearch() {
    const keyword = document.getElementById('searchInput').value.trim();
    if (!keyword) {
        alert("Vui lòng nhập từ khóa!");
        return;
    }

    document.getElementById('searchSuggestions').classList.remove('show');

    const homeSections = document.getElementById("homeSections");
    const resultSection = document.getElementById("searchResultSection");
    const resultContainer = document.getElementById("searchResultContainer");
    
    if(homeSections) homeSections.style.display = "none";
    if(resultSection) resultSection.style.display = "block";
    resultContainer.innerHTML = '<div style="grid-column:span 4; text-align:center; padding:50px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i><p>Đang tìm kiếm...</p></div>';

    const searchKey = removeVietnameseTones(keyword.toLowerCase());
    
    const matchedCatIds = globalSearchData.categories
        .filter(c => removeVietnameseTones(c.TenTheLoai.toLowerCase()).includes(searchKey))
        .map(c => c.TheLoaiID);

    const matchedAuthorIds = globalSearchData.authors
        .filter(a => removeVietnameseTones(a.TenTacGia.toLowerCase()).includes(searchKey))
        .map(a => a.TacGiaID);

    const foundBooks = globalSearchData.books.filter(book => {
        const nameMatch = removeVietnameseTones(book.TenSach.toLowerCase()).includes(searchKey);
        const catMatch = matchedCatIds.includes(book.TheLoaiID);
        const authorMatch = matchedAuthorIds.includes(book.TacGiaID);
        return nameMatch || catMatch || authorMatch;
    });

    const titleElement = document.querySelector('.section-title');
    if(titleElement) titleElement.innerText = `KẾT QUẢ TÌM KIẾM: "${keyword}" (${foundBooks.length} sách)`;

    if (foundBooks.length > 0) {
        renderBooksToHTML(foundBooks, "searchResultContainer");
    } else {
        resultContainer.innerHTML = `<div style="grid-column:span 4; text-align:center; padding: 60px;">
            <p>Không tìm thấy sản phẩm nào.</p>
            <button onclick="location.reload()" style="margin-top:10px; padding:8px 15px; cursor:pointer;">Quay lại</button>
        </div>`;
    }
}

// Các hàm tiện ích xử lý chuỗi
function highlightText(text, keyword) {
    if(!text) return "";
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<span class="highlight-text">$1</span>');
}

function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); 
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); 
    str = str.replace(/ + /g," ");
    str = str.trim();
    return str;
}

// =========================================================================
// LOGIC HIỂN THỊ SÁCH BÁN CHẠY / SÁCH MỚI
// =========================================================================

async function loadHotSales() {
    try {
        const url = AppConfig.getUrl("sach/ban-chay"); 
        const res = await fetch(url);
        const data = await res.json();
        if (data.status && data.data) {
            renderBooksToHTML(data.data.slice(0, 4), "bestSalesContainer");
        }
    } catch (err) { console.error("Lỗi tải sách bán chạy:", err); }
}

async function loadNewBooks() {
    try {
        const url = AppConfig.getUrl("sach/moi");
        const res = await fetch(url);
        const data = await res.json();
        if (data.status && data.data) {
            const startIndex = data.data.length > 4 ? 0 : 0; 
            renderBooksToHTML(data.data.slice(startIndex, startIndex + 4), "newBooksContainer");
        }
    } catch (err) { console.error("Lỗi tải sách mới:", err); }
}

function renderBooksToHTML(list, containerId) {
    const box = document.getElementById(containerId);
    if (!box) return;

    if (!list || list.length === 0) return;

    let html = "";
    list.forEach(book => {
        const imgUrl = book.AnhBia && book.AnhBia !== "null" 
            ? (book.AnhBia.startsWith("http") ? book.AnhBia : `../img/${book.AnhBia}`) 
            : "https://via.placeholder.com/200x300";
        
        let tacGia = book.TenTacGia; 
        if (!tacGia && globalSearchData.authors.length > 0) {
             const a = globalSearchData.authors.find(au => au.TacGiaID == book.TacGiaID);
             if(a) tacGia = a.TenTacGia;
        }
        
        let theLoai = book.TenTheLoai;
        if (!theLoai && globalSearchData.categories.length > 0) {
            const c = globalSearchData.categories.find(cat => cat.TheLoaiID == book.TheLoaiID);
            if(c) theLoai = c.TenTheLoai;
        }

        let nxb = book.TenNhaXuatBan;
        if (!nxb && globalSearchData.publishers.length > 0) {
            const p = globalSearchData.publishers.find(pub => pub.NhaXuatBanID == book.NhaXuatBanID);
            if(p) nxb = p.TenNhaXuatBan;
        }

        tacGia = tacGia || "Chưa cập nhật";
        theLoai = theLoai || "Khác";
        nxb = nxb || "NXB Khác";

        const soLuongTon = parseInt(book.SoLuong || 0);
        const trangThai = parseInt(book.TrangThai); 
        let btnCartHtml = '';

        if (soLuongTon <= 0 || trangThai === 2) {
            btnCartHtml = `<button class="btn-add-cart-mini" disabled style="background:#ccc; cursor:not-allowed;" title="Hết hàng"><i class="fa-solid fa-ban"></i></button>`;
        } else if (trangThai === 0) {
            btnCartHtml = `<button class="btn-add-cart-mini" disabled style="background:#ccc; cursor:not-allowed;" title="Ngừng kinh doanh"><i class="fa-solid fa-lock"></i></button>`;
        } else {
            btnCartHtml = `<button class="btn-add-cart-mini" onclick="addToCartCheck(${book.SachID}, ${soLuongTon})" title="Thêm vào giỏ"><i class="fa-solid fa-cart-shopping"></i></button>`;
        }

        html += `
        <div class="product-card" style="height: auto; min-height: 420px;">
            ${book.PhanTramGiam > 0 ? `<span class="badge-sale">-${book.PhanTramGiam}%</span>` : ""}
            <a href="chitietsanpham.html?id=${book.SachID}" class="card-img-wrap">
                <img src="${imgUrl}" class="p-img" alt="${book.TenSach}" onerror="this.src='https://via.placeholder.com/200x300'">
            </a>
            <a href="chitietsanpham.html?id=${book.SachID}">
                <h3 class="p-name" title="${book.TenSach}" style="margin-bottom: 5px;">${book.TenSach}</h3>
            </a>
            
            <div class="p-meta" style="font-size: 0.85rem; color: #666; line-height: 1.6; margin-bottom: 10px;">
                 <div class="p-meta-item" title="Tác giả">
                    <i class="fa-solid fa-pen-nib" style="width:15px; text-align:center;"></i> <strong>${tacGia}</strong>
                 </div>
                 <div class="p-meta-item" title="Thể loại">
                    <i class="fa-solid fa-book" style="width:15px; text-align:center;"></i> <span>${theLoai}</span>
                 </div>
                 <div class="p-meta-item" title="Nhà xuất bản">
                    <i class="fa-solid fa-building" style="width:15px; text-align:center;"></i> <span>${nxb}</span>
                 </div>
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

async function loadCategories() {
    try {
        const res = await fetch(AppConfig.getUrl("theloai"));
        const data = await res.json();
        const listContainer = document.getElementById("categoryList");
        if(!listContainer) return;

        let html = `
            <label class="cat-check-item" style="font-weight:700; color:#000;">
                <input type="checkbox" value="all" class="filter-checkbox" id="cbAll" checked onchange="handleCheckAll(this)">
                <span><i class="fa-solid fa-border-all"></i> Tất cả</span>
            </label>
            <div style="height:1px; background:#f1f1f1; margin:5px 15px;"></div>
        `;
        if (data.status && data.data) {
            data.data.forEach(cat => {
                const icon = getCategoryIcon(cat.TenTheLoai);
                html += `
                <label class="cat-check-item">
                    <input type="checkbox" value="${cat.TheLoaiID}" class="filter-checkbox sub-checkbox" onchange="handleCheckSub(this)">
                    <span><i class="fa-solid ${icon}"></i> ${cat.TenTheLoai}</span>
                </label>`;
            });
        }
        listContainer.innerHTML = html;
        checkUrlAndFilter();
    } catch (err) { console.error(err); }
}

function checkUrlAndFilter() {
    const urlParams = new URLSearchParams(window.location.search);
    const catId = urlParams.get('catId');

    if (catId) {
        const cbAll = document.getElementById('cbAll');
        if (cbAll) cbAll.checked = false;

        setTimeout(() => {
            const targetCheckbox = document.querySelector(`.filter-checkbox[value="${catId}"]`);
            if (targetCheckbox) {
                targetCheckbox.checked = true;
                
                document.querySelectorAll('.main-nav a').forEach(link => {
                    if(link.href.includes(`catId=${catId}`)) {
                        link.classList.add('active'); 
                        const homeLink = document.querySelector('.main-nav a[href="index.html"]');
                        if(homeLink && homeLink !== link) homeLink.classList.remove('active');
                    }
                });
                applyFilter();
            }
        }, 100);
    } else {
        const cbAll = document.getElementById('cbAll');
        if (cbAll) cbAll.checked = true;
        document.querySelectorAll('.sub-checkbox').forEach(cb => cb.checked = false);

        const cbPriceAll = document.getElementById('cbPriceAll');
        if (cbPriceAll) cbPriceAll.checked = true;
        document.querySelectorAll('.sub-price-checkbox').forEach(cb => cb.checked = false);

        const homeSections = document.getElementById("homeSections");
        const resultSection = document.getElementById("searchResultSection");
        const titleElement = document.querySelector('.section-title');

        if (homeSections) homeSections.style.display = "block";
        if (resultSection) resultSection.style.display = "none";
        if (titleElement) titleElement.innerText = "KẾT QUẢ LỌC";

        document.querySelectorAll('.main-nav a').forEach(link => link.classList.remove('active'));
        const homeLink = document.querySelector('.main-nav a[href="index.html"]'); 
        if (homeLink) homeLink.classList.add('active');
    }
}

// --- LOGIC CHECKBOX MỚI: CHỈ CHỌN 1 ---

function handleCheckAll(cbAll) {
    if (cbAll.checked) document.querySelectorAll('.sub-checkbox').forEach(cb => cb.checked = false);
}

// [ĐÃ SỬA] Chọn 1 danh mục -> Bỏ chọn các danh mục khác
function handleCheckSub(cbSub) {
    const cbAll = document.getElementById('cbAll');
    if (cbSub.checked) {
        if (cbAll) cbAll.checked = false;
        document.querySelectorAll('.sub-checkbox').forEach(cb => {
            if (cb !== cbSub) cb.checked = false;
        });
    } else {
        if (cbAll) cbAll.checked = true;
    }
}

function handlePriceCheckAll(cbAll) {
    if (cbAll.checked) {
        document.querySelectorAll('.sub-price-checkbox').forEach(cb => cb.checked = false);
    }
}

// [ĐÃ SỬA] Chọn 1 mức giá -> Bỏ chọn các mức giá khác
function handlePriceCheckSub(cbSub) {
    const cbAll = document.getElementById('cbPriceAll');
    if (cbSub.checked) {
        if (cbAll) cbAll.checked = false;
        document.querySelectorAll('.sub-price-checkbox').forEach(cb => {
            if (cb !== cbSub) cb.checked = false;
        });
    } else {
        if (cbAll) cbAll.checked = true;
    }
}

// ---------------------------------------

async function applyFilter() {
    const checkedCatBoxes = document.querySelectorAll('.filter-checkbox:checked');
    const selectedCatIds = Array.from(checkedCatBoxes).map(cb => cb.value);

    const checkedPriceBoxes = document.querySelectorAll('.price-checkbox:checked');
    const selectedPrices = Array.from(checkedPriceBoxes).map(cb => cb.value);

    const homeSections = document.getElementById("homeSections");
    const resultSection = document.getElementById("searchResultSection");
    const resultContainer = document.getElementById("searchResultContainer");

    homeSections.style.display = "none";
    resultSection.style.display = "block";
    resultContainer.innerHTML = '<div style="grid-column:span 4; text-align:center; padding:50px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i><p style="margin-top:10px; color:#666">Đang lọc sách...</p></div>';

    try {
        let url;
        if (selectedCatIds.includes('all') || selectedCatIds.length === 0) url = AppConfig.getUrl("sach"); 
        else url = AppConfig.getUrl(`sach/loc-theo-danh-muc?ids=${selectedCatIds.join(',')}`);

        const res = await fetch(url);
        const data = await res.json();
        let finalBooks = [];

        if (data.status && data.data) {
            finalBooks = data.data;

            if (selectedPrices.length > 0 && !selectedPrices.includes('all')) {
                finalBooks = finalBooks.filter(book => {
                    const giaThuc = book.GiaBan || (book.Gia * (1 - (book.PhanTramGiam / 100)));
                    
                    return selectedPrices.some(range => {
                        const [minStr, maxStr] = range.split('-');
                        const min = parseInt(minStr);
                        const max = maxStr === 'max' ? Infinity : parseInt(maxStr);
                        return giaThuc >= min && giaThuc < max;
                    });
                });
            }

            document.querySelector('.section-title').innerText = `KẾT QUẢ LỌC (${finalBooks.length} sách)`;
            
            if (finalBooks.length > 0) {
                renderBooksToHTML(finalBooks, "searchResultContainer");
            } else {
                 resultContainer.innerHTML = `
                    <div style="grid-column:span 4; text-align:center; padding: 40px;">
                        <i class="fa-solid fa-box-open" style="font-size:40px; color:#ddd; margin-bottom:15px;"></i>
                        <p>Không tìm thấy sách nào phù hợp với bộ lọc.</p>
                    </div>`;
            }
        } else {
             resultContainer.innerHTML = `<p style="text-align:center">Lỗi tải dữ liệu.</p>`;
        }
    } catch (err) { console.error(err); }
}

function getCategoryIcon(name) {
    const n = name.toLowerCase();
    if (n.includes('truyện tranh')) return 'fa-hat-wizard';
    if (n.includes('kinh dị')) return 'fa-ghost';
    if (n.includes('trinh thám')) return 'fa-user-secret';
    if (n.includes('giáo trình')) return 'fa-graduation-cap';
    return 'fa-book';
}
function formatMoney(num) { 
    return Number(num).toLocaleString("vi-VN") + "đ"; 
}

function addToCartCheck(sachId, stock) {
    if (stock <= 0) {
        alert("Sản phẩm này đã hết hàng!");
        return;
    }
    addToCartAndRedirect(sachId);
}

async function addToCartAndRedirect(sachId) {
    const userJson = localStorage.getItem("user");
    
    if (!userJson) {
        if(confirm("Bạn cần đăng nhập để thêm sản phẩm vào giỏ. Đi đến trang đăng nhập?")) {
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
                SoLuong: 1 
            })
        });

        const data = await res.json();

        if (data.status) {
            alert("Đã thêm sản phẩm vào giỏ hàng thành công!");
            if (typeof updateCartBadge === 'function') {
                updateCartBadge();
            }
        } else {
            alert(data.message || "Lỗi: Không thể thêm vào giỏ hàng.");
        }

    } catch (err) {
        console.error("Lỗi thêm giỏ hàng:", err);
        alert("Lỗi kết nối đến server!");
    }
}