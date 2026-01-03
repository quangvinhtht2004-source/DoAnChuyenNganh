document.addEventListener("DOMContentLoaded", () => {
    loadReviews();
    
    // Gán sự kiện tìm kiếm và lọc
    document.getElementById("searchReview").addEventListener("input", applyFilter);
    document.getElementById("filterStar").addEventListener("change", applyFilter);
});

let allReviewsData = []; // Lưu trữ dữ liệu gốc

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

        // Cấu trúc trả về của ReviewController là: { data: { reviews: [...], stats: {...} } }
        // Hoặc nếu helper jsonResponse trả thẳng data thì cần kiểm tra log.
        // Dựa vào code ReviewController: jsonResponse(true, "...", ['reviews' => $reviews...])
        
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
// 2. LỌC DỮ LIỆU (Search + Star)
// =======================================================
function applyFilter() {
    const textTerm = document.getElementById("searchReview").value.toLowerCase().trim();
    const starTerm = document.getElementById("filterStar").value; // "1" -> "5"

    const filtered = allReviewsData.filter(r => {
        // 1. Tìm theo tên khách HOẶC tên sách
        const nameMatch = (r.HoTen && r.HoTen.toLowerCase().includes(textTerm));
        const bookMatch = (r.TenSach && r.TenSach.toLowerCase().includes(textTerm));
        
        // 2. Lọc theo số sao
        const starMatch = (starTerm === "") || (r.SoSao == starTerm);

        return (nameMatch || bookMatch) && starMatch;
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

        html += `
            <tr>
                <td style="text-align:center; color:#888;">#${r.ReviewID}</td>
                <td><strong>${r.HoTen}</strong></td>
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