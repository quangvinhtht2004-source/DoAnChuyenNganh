<?php
class Router {

    private $routes = [
        'GET' => [],
        'POST' => []
    ];

    /** Đăng ký GET route */
    public function get($path, $action) {
        $this->routes['GET'][$path] = $action;
    }

    /** Đăng ký POST route */
    public function post($path, $action) {
        $this->routes['POST'][$path] = $action;
    }

    /** Điều hướng Router */
    public function dispatch() {
        // URL sau rewrite: index.php?url=theloai, sach/moi, ...
        $url = isset($_GET['url']) ? trim($_GET['url'], "/") : "";

        // Lấy method GET/POST
        $method = $_SERVER['REQUEST_METHOD'];

        // Nếu URL rỗng → không có route nào
        if ($url === "") {
            echo json_encode([
                "status" => false,
                "message" => "Không tìm thấy route"
            ]);
            return;
        }

        // Tìm trong danh sách routes
        if (!isset($this->routes[$method][$url])) {
            echo json_encode([
                "status" => false,
                "message" => "Route không tồn tại: $method $url"
            ]);
            return;
        }

        // Lấy controller và method: Ví dụ: TheLoaiController@list
        list($controllerName, $methodName) = explode("@", $this->routes[$method][$url]);

        // Load file controller
        $file = __DIR__ . "/../controllers/" . $controllerName . ".php";
        if (!file_exists($file)) {
            echo json_encode(["status" => false, "message" => "Không tìm thấy controller"]);
            return;
        }
        require_once $file;

        // Khởi tạo controller
        $controller = new $controllerName();

        // Gọi hàm xử lý
        if (!method_exists($controller, $methodName)) {
            echo json_encode(["status" => false, "message" => "Hàm xử lý không tồn tại"]);
            return;
        }

        $controller->$methodName();
    }
}
