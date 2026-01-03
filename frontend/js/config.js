const AppConfig = {
    // QUAN TRỌNG: Thay 'WebsiteBanSach' bằng tên thư mục thực tế của bạn trong htdocs
    // Ví dụ: http://localhost/DO_AN_CUA_BAN/backend
    API_BASE_URL: "http://localhost/WebsiteBanSach/backend",

    getUrl: function(route) {
        // Loại bỏ dấu / thừa nếu có để tránh lỗi http://...//api
        const base = this.API_BASE_URL.replace(/\/+$/, "");
        const path = route.replace(/^\/+/, "");
        return `${base}/${path}`;
    }
};

window.AppConfig = AppConfig;