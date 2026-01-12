document.addEventListener("DOMContentLoaded", () => {
            const userJson = localStorage.getItem("user");
            if (!userJson) {
                alert("Vui lòng đăng nhập để xem đơn hàng!");
                window.location.href = "dangnhap.html";
                return;
            }

            const user = JSON.parse(userJson);
            loadUserProfileSidebar(user);
            loadOrderHistory(user.UserID);

            document.getElementById("logoutBtnSidebar").addEventListener("click", (e) => {
                e.preventDefault();
                localStorage.removeItem("user");
                window.location.href = "index.html";
            });
        });

        function loadUserProfileSidebar(user) {
            document.getElementById("sidebarName").textContent = user.HoTen || "Khách hàng";
            const avatarUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.HoTen) + "&background=FF6600&color=fff";
            document.getElementById("sidebarAvatar").src = avatarUrl;
        }

        async function loadOrderHistory(userId) {
            try {
                const res = await fetch(AppConfig.getUrl(`don-hang/lich-su?userId=${userId}`));
                const data = await res.json();

                document.getElementById("loadingText").style.display = "none";
                const container = document.getElementById("orderListContainer");

                if (!data.status || !data.data || data.data.length === 0) {
                    container.innerHTML = `
                        <div style="text-align:center; padding: 40px; color: #777;">
                            <i class="fa-solid fa-box-open" style="font-size: 40px; margin-bottom: 10px;"></i>
                            <p>Bạn chưa có đơn hàng nào.</p>
                            <a href="index.html" style="color: #FF6600; text-decoration: underline;">Mua sắm ngay</a>
                        </div>`;
                    return;
                }

                const userJson = localStorage.getItem("user");
                const currentUser = userJson ? JSON.parse(userJson) : {};
                renderOrders(data.data, container, currentUser);

            } catch (err) {
                console.error(err);
                document.getElementById("loadingText").innerHTML = `<p style="color:red">Lỗi tải dữ liệu đơn hàng.</p>`;
            }
        }

        function renderOrders(orders, container, currentUser) {
            let html = "";
            
            orders.forEach(order => {
                const statusText = getStatusText(order.TrangThai);
                const isCancellable = order.TrangThai === "ChoXacNhan";
                const date = new Date(order.NgayTao).toLocaleString('vi-VN');

                // Lấy thông tin người nhận
                const receiverName = order.NguoiNhan || order.HoTen || currentUser.HoTen || "Khách hàng";
                const receiverPhone = order.SDT || order.SoDienThoai || currentUser.SoDienThoai || "";
                
                // Escape chuỗi để tránh lỗi JS khi truyền vào onclick
                const safeName = (receiverName || "").replace(/'/g, "\\'");
                const safeAddr = (order.DiaChiGiao || "").replace(/'/g, "\\'");
                const method = order.PhuongThucTT || 'COD';
                const voucherDisc = order.TienGiamVoucher || 0;

                // Lấy tiền trực tiếp từ DB (Backend đã tính ship rồi)
                const displayTotal = parseInt(order.TongTien);

                html += `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <span class="order-id">#DH${order.DonHangID}</span>
                            <span class="order-date">${date}</span>
                        </div>
                        <span class="status-badge status-${order.TrangThai}">${statusText}</span>
                    </div>
                    <div class="order-body">
                        <div class="order-info">
                            <p><i class="fa-solid fa-user"></i> <strong>Người nhận:</strong> ${receiverName} ${receiverPhone ? '- ' + receiverPhone : ''}</p>
                            <p><i class="fa-solid fa-location-dot"></i> <strong>Địa chỉ:</strong> ${order.DiaChiGiao || 'Nhận tại cửa hàng'}</p>
                            <p><i class="fa-solid fa-money-bill"></i> <strong>TT:</strong> ${method === 'STORE' ? 'Thanh toán tại quầy' : method}</p>
                            <p><strong>Tổng tiền:</strong> <span class="total-price">${formatMoney(displayTotal)}</span></p>
                        </div>
                        <div class="order-actions">
                            <button class="btn-detail" onclick="viewDetail(${order.DonHangID}, ${displayTotal}, '${safeName}', '${receiverPhone}', '${safeAddr}', '${method}', ${voucherDisc})">Xem Chi Tiết</button>
                            ${isCancellable ? `<button class="btn-cancel" onclick="cancelOrder(${order.DonHangID})">Hủy Đơn</button>` : ''}
                        </div>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        }

        async function cancelOrder(orderId) {
            if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

            try {
                const res = await fetch(AppConfig.getUrl("don-hang/cap-nhat"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ DonHangID: orderId, TrangThai: "DaHuy" })
                });

                const data = await res.json();
                if (data.status) {
                    alert("Đã hủy đơn hàng thành công!");
                    location.reload();
                } else {
                    alert(data.message || "Không thể hủy đơn hàng.");
                }
            } catch (err) {
                console.error(err);
                alert("Lỗi kết nối Server.");
            }
        }

        // --- HÀM XEM CHI TIẾT (ĐÃ CẬP NHẬT) ---
        async function viewDetail(orderId, finalTotal, name, phone, address, paymentMethod, voucherDiscount) {
            const modal = document.getElementById("orderDetailModal");
            const modalBody = document.getElementById("modalBody");
            
            modal.style.display = "flex";
            modalBody.innerHTML = '<div style="padding:40px; text-align:center;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color:#FF6600"></i><p style="margin-top:10px; color:#555;">Đang tải chi tiết...</p></div>';

            try {
                const res = await fetch(AppConfig.getUrl(`don-hang/chi-tiet?id=${orderId}`));
                const data = await res.json();

                if (data.status && data.data) {
                    const items = data.data;
                    let listHtml = "";
                    let itemTotal = 0; 

                    items.forEach(item => {
                        const imgUrl = item.AnhBia && item.AnhBia.startsWith("http") ? item.AnhBia : `../img/${item.AnhBia}`;
                        const thanhTien = item.DonGia * item.SoLuong;
                        itemTotal += thanhTien;

                        listHtml += `
                        <div class="detail-item">
                            <img src="${imgUrl}" class="detail-img" onerror="this.src='https://via.placeholder.com/60'">
                            <div class="detail-info">
                                <a href="chitietsanpham.html?id=${item.SachID}" class="detail-name">${item.TenSach}</a>
                                <div class="detail-meta">
                                    <span style="color:#555">${formatMoney(item.DonGia)}</span> x <strong>${item.SoLuong}</strong>
                                </div>
                            </div>
                            <div style="font-weight:700; color:#333; margin-left:10px;">
                                ${formatMoney(thanhTien)}
                            </div>
                        </div>`;
                    });

                    // --- LOGIC HIỂN THỊ TIỀN (Chính xác theo DB) ---
                    let shipRow = "";
                    
                    if (paymentMethod === 'STORE') {
                        shipRow = `
                        <div class="sum-row">
                            <span>Phí vận chuyển:</span>
                            <span>0đ (Nhận tại cửa hàng)</span>
                        </div>`;
                    } else {
                        // Tính ngược phí ship: Tổng cuối - (Tiền hàng - Voucher)
                        // Nếu dương thì là tiền ship.
                        // Lưu ý: Đôi khi logic làm tròn số có thể lệch 1 vài đồng, nhưng thường 30k là cố định.
                        const calculatedShip = finalTotal - (itemTotal - voucherDiscount);
                        const displayShip = calculatedShip > 0 ? formatMoney(calculatedShip) : "Miễn phí";

                        shipRow = `
                        <div class="sum-row">
                            <span>Phí vận chuyển:</span>
                            <span>${displayShip}</span>
                        </div>`;
                    }
                    
                    let voucherRow = "";
                    if (voucherDiscount > 0) {
                        voucherRow = `
                        <div class="sum-row" style="color: #28a745; font-weight:600;">
                            <span><i class="fa-solid fa-ticket"></i> Voucher giảm giá:</span>
                            <span>- ${formatMoney(voucherDiscount)}</span>
                        </div>`;
                    }

                    modalBody.innerHTML = `
                    <div class="customer-info-section">
                        <h4><i class="fa-solid fa-address-card"></i> Thông tin nhận hàng</h4>
                        <div class="info-line"><strong>Người nhận:</strong> <span>${name}</span></div>
                        <div class="info-line"><strong>Số điện thoại:</strong> <span>${phone}</span></div>
                        <div class="info-line"><strong>Địa chỉ:</strong> <span>${paymentMethod === 'STORE' ? 'Nhận tại cửa hàng' : address}</span></div>
                        <div class="info-line"><strong>Thanh toán:</strong> <span>${paymentMethod}</span></div>
                    </div>

                    <div style="margin-bottom:10px; font-weight:700; color:#555; font-size:14px; text-transform:uppercase;">Danh sách sản phẩm</div>
                    ${listHtml}

                    <div class="modal-summary">
                        <div class="sum-row">
                            <span>Tổng tiền hàng (${items.length} sản phẩm):</span>
                            <span>${formatMoney(itemTotal)}</span>
                        </div>
                        ${voucherRow}
                        ${shipRow}
                        <div class="sum-row final">
                            <span>TỔNG THANH TOÁN:</span>
                            <span>${formatMoney(finalTotal)}</span>
                        </div>
                    </div>`;

                } else {
                    modalBody.innerHTML = "<p class='text-center'>Không tìm thấy chi tiết đơn hàng.</p>";
                }
            } catch (err) {
                console.error(err);
                modalBody.innerHTML = "<p style='color:red; text-align:center;'>Lỗi kết nối đến máy chủ.</p>";
            }
        }

        function closeModal() {
            document.getElementById("orderDetailModal").style.display = "none";
        }

        function getStatusText(status) {
            switch(status) {
                case 'ChoXacNhan': return 'Chờ xác nhận';
                case 'DangXuLy': return 'Đang xử lý';
                case 'DangGiao': return 'Đang giao hàng';
                case 'HoanThanh': return 'Hoàn thành';
                case 'DaHuy': return 'Đã hủy';
                default: return status;
            }
        }
        
        window.onclick = function(event) {
            const modal = document.getElementById("orderDetailModal");
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }