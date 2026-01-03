// js/admin-manager.js

let currentId = null; // Lưu ID khi đang sửa
let pageConfig = {};  // Cấu hình riêng cho từng trang (API url, tên trường ID, tên trường hiển thị...)

// Hàm khởi tạo cho trang
function initPage(config) {
    pageConfig = config;
    loadData();
}

// 1. LẤY DỮ LIỆU
async function loadData() {
    try {
        const res = await fetch(AppConfig.getUrl(pageConfig.apiUrl));
        const json = await res.json();
        
        const tbody = document.getElementById("tableBody");
        tbody.innerHTML = "";

        if (json.status && json.data) {
            json.data.forEach(item => {
                const row = document.createElement("tr");
                // Render tùy chỉnh nếu có hàm renderRow, ngược lại render mặc định
                if (pageConfig.renderRow) {
                    row.innerHTML = pageConfig.renderRow(item);
                } else {
                    // Mặc định cho Thể loại, Tác giả, NXB
                    row.innerHTML = `
                        <td>#${item[pageConfig.idField]}</td>
                        <td style="font-weight:500">${item[pageConfig.nameField]}</td>
                        <td class="action-col">
                            <button class="btn-icon btn-edit" onclick='openModal(${JSON.stringify(item)})'><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-icon btn-delete" onclick="deleteItem(${item[pageConfig.idField]})"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    `;
                }
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;">Không có dữ liệu</td></tr>`;
        }
    } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
    }
}

// 2. MỞ MODAL (Thêm hoặc Sửa)
function openModal(item = null) {
    const modal = document.getElementById("editModal");
    const modalTitle = document.getElementById("modalTitle");
    const form = document.getElementById("dataForm");

    form.reset();
    modal.classList.add("show");
    modal.style.display = "flex";

    if (item) {
        // Chế độ Sửa
        currentId = item[pageConfig.idField];
        modalTitle.innerText = "Cập nhật thông tin";
        
        // Điền dữ liệu vào form (Tự động map theo name="Key")
        Object.keys(item).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = item[key];
        });

        // Callback riêng nếu trang cần xử lý thêm khi mở modal sửa
        if (pageConfig.onEdit) pageConfig.onEdit(item);

    } else {
        // Chế độ Thêm
        currentId = null;
        modalTitle.innerText = "Thêm mới";
        if (pageConfig.onAdd) pageConfig.onAdd();
    }
}

function closeModal() {
    const modal = document.getElementById("editModal");
    modal.classList.remove("show");
    modal.style.display = "none";
}

// 3. LƯU DỮ LIỆU (CREATE / UPDATE)
async function saveData() {
    const form = document.getElementById("dataForm");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Nếu đang sửa, nhét thêm ID vào payload
    if (currentId) {
        data[pageConfig.idField] = currentId;
    }

    const endpoint = currentId ? `${pageConfig.apiUrl}/sua` : `${pageConfig.apiUrl}/tao`;

    try {
        const res = await fetch(AppConfig.getUrl(endpoint), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        const json = await res.json();

        if (json.status) {
            alert(json.message);
            closeModal();
            loadData();
        } else {
            alert(json.message || "Có lỗi xảy ra");
        }
    } catch (err) {
        console.error(err);
        alert("Lỗi kết nối server");
    }
}

// 4. XÓA DỮ LIỆU
async function deleteItem(id) {
    if (!confirm("Bạn có chắc muốn xóa mục này?")) return;

    try {
        const payload = {};
        payload[pageConfig.idField] = id;

        const res = await fetch(AppConfig.getUrl(`${pageConfig.apiUrl}/xoa`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (json.status) {
            alert(json.message);
            loadData();
        } else {
            alert(json.message);
        }
    } catch (err) {
        alert("Lỗi kết nối xóa");
    }
}

// Đóng modal khi click ra ngoài
window.onclick = function(event) {
    const modal = document.getElementById("editModal");
    if (event.target == modal) closeModal();
}