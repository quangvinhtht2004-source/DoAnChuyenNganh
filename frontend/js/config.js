const AppConfig = {
    API_BASE_URL: "http://localhost/WebsiteBanSach/backend",

    getUrl: function(route) {
        const base = this.API_BASE_URL.replace(/\/+$/, "");
        const path = route.replace(/^\/+/, "");
        return `${base}/${path}`;
    }
};

window.AppConfig = AppConfig;