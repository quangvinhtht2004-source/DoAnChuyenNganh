const AppConfig = {
    API_BASE_URL: "http://localhost/WebsiteBanSach/backend",

    getUrl: function(route) {
        return `${this.API_BASE_URL}/${route}`;
    }
};

window.AppConfig = AppConfig;
