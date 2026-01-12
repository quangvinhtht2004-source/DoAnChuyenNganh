document.addEventListener("DOMContentLoaded", () => {
    loadReviews();
    
    // Gán sự kiện tìm kiếm và lọc
    document.getElementById("searchReview").addEventListener("input", applyFilter);
    document.getElementById("filterStar").addEventListener("change", applyFilter);
});

let allReviewsData = []; // Lưu trữ dữ liệu gốc

// --- HÀM HỖ TRỢ: XÓA DẤU TIẾNG VIỆT ---
function removeVietnameseTones(str) {
    if (!str) return "";
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    // Một số bộ gõ tiếng Việt tạo ra ký tự đặc biệt, cần loại bỏ
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); 
    return str;
}

// =======================================================
// 1. TẢI DỮ LIỆU TỪ API
// =======================================================
async function loadReviews() {
    const table = document.getElementById("reviewsTable");
    table.innerHTML = `<tr><td colspan="7" style="text-align:center;">Đang tải dữ liệu...</td></tr>`;

    try {
        // Gọi API lấy danh sách review
        const res = await fetch(AppConfig.getUrl("review"));
        const data = await res.json();
        
        if (data.status && data.data && Array.isArray(data.data.reviews)) {
            // Sắp xếp ID giảm dần (Mới nhất lên đầu)
            allReviewsData = data.data.reviews.sort((a, b) => b.ReviewID - a.ReviewID);
            renderTable(allReviewsData);
        } else {
            table.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Không có dữ liệu đánh giá</td></tr>`;
        }
    } catch (err) {
        console.error(err);
        table.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Lỗi kết nối server</td></tr>`;
    }
}

// =======================================================
// 2. LỌC DỮ LIỆU (Search + Star) - HỖ TRỢ TIẾNG VIỆT
// =======================================================
function applyFilter() {
    const rawTerm = document.getElementById("searchReview").value.trim();
    const term = removeVietnameseTones(rawTerm); // Chuyển từ khóa sang không dấu
    const starTerm = document.getElementById("filterStar").value; // "1" -> "5"

    const filtered = allReviewsData.filter(r => {
        // Chuẩn hóa dữ liệu trong row
        const nameRaw = r.HoTen || "";
        const emailRaw = r.Email || ""; // Lấy thêm email để tìm
        const bookRaw = r.TenSach || "";

        const name = removeVietnameseTones(nameRaw);
        const email = removeVietnameseTones(emailRaw);
        const book = removeVietnameseTones(bookRaw);

        // 1. Tìm theo tên khách HOẶC email HOẶC tên sách
        const matchText = name.includes(term) || email.includes(term) || book.includes(term);
        
        // 2. Lọc theo số sao
        const starMatch = (starTerm === "") || (r.SoSao == starTerm);

        return matchText && starMatch;
    });

    renderTable(filtered);
}

window.resetFilter = function() {
    document.getElementById("searchReview").value = "";
    document.getElementById("filterStar").value = "";
    renderTable(allReviewsData);
}

// =======================================================
// 3. HIỂN THỊ BẢNG
// =======================================================
function renderTable(list) {
    const table = document.getElementById("reviewsTable");
    
    if (!list || list.length === 0) {
        table.innerHTML = `<tr><td colspan="7" style="text-align:center;">Không tìm thấy kết quả phù hợp</td></tr>`;
        return;
    }

    let html = "";
    list.forEach(r => {
        // Format ngày tháng
        const dateStr = r.NgayDanhGia ? new Date(r.NgayDanhGia).toLocaleDateString('vi-VN') : "-";
        
        // Tạo HTML hiển thị sao (Vàng cho sao đạt được, Xám cho sao rỗng)
        let starsHtml = '<span class="star-rating">';
        for (let i = 1; i <= 5; i++) {
            if (i <= r.SoSao) {
                starsHtml += '<i class="fa-solid fa-star"></i>';
            } else {
                starsHtml += '<i class="fa-regular fa-star" style="color:#ccc;"></i>';
            }
        }
        starsHtml += '</span>';

        // Hiển thị tên kèm Email (nếu có)
        const displayName = r.HoTen || "Người dùng ẩn danh";
        const displayEmail = r.Email ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">${r.Email}</div>` : "";

        html += `
            <tr>
                <td style="text-align:center; color:#888;">#${r.ReviewID}</td>
                <td>
                    <strong>${displayName}</strong>
                    ${displayEmail}
                </td>
                <td style="color:#007bff;">${r.TenSach}</td>
                <td style="text-align:center;">${starsHtml}</td>
                <td>
                    <div class="review-comment" title="${r.BinhLuan}">${r.BinhLuan}</div>
                </td>
                <td style="text-align:center;">${dateStr}</td>
                <td style="text-align:center;">
                    <button class="btn-delete-review" onclick="deleteReview(${r.ReviewID})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    table.innerHTML = html;
}

// =======================================================
// 4. XÓA ĐÁNH GIÁ
// =======================================================
window.deleteReview = async function(reviewId) {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác.")) {
        return;
    }

    try {
        const res = await fetch(AppConfig.getUrl("review/xoa"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ReviewID: reviewId })
        });

        const result = await res.json();

        if (result.status) {
            alert("✅ Đã xóa đánh giá thành công!");
            loadReviews(); // Tải lại danh sách
        } else {
            alert("❌ Lỗi: " + (result.message || "Xóa thất bại"));
        }
    } catch (err) {
        console.error(err);
        alert("❌ Lỗi kết nối server khi xóa review!");
    }
}