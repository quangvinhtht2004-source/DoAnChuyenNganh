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
        $url = "";

        // CÁCH 1: Lấy từ tham số ?url= (Do .htaccess truyền vào)
        if (isset($_GET['url'])) {
            $url = trim($_GET['url'], "/");
        }
        // CÁCH 2: Tự động cắt từ đường dẫn (Nếu Cách 1 thất bại hoặc không dùng .htaccess)
        else {
            $uri = $_SERVER['REQUEST_URI'];
            
            // 1. Loại bỏ query string (ví dụ: ?id=1)
            if (strpos($uri, '?') !== false) {
                $uri = substr($uri, 0, strpos($uri, '?'));
            }

            // 2. Lấy đường dẫn thư mục gốc (ví dụ: /WebsiteBanSach/backend)
            $scriptName = dirname($_SERVER['SCRIPT_NAME']);
            $scriptName = str_replace('\\', '/', $scriptName); // Chuẩn hóa dấu gạch chéo cho Windows

            // 3. Loại bỏ thư mục gốc khỏi URI
            if (strpos($uri, $scriptName) === 0) {
                $uri = substr($uri, strlen($scriptName));
            }

            // 4. Loại bỏ /index.php nếu còn sót
            $uri = str_replace('/index.php', '', $uri);

            $url = trim($uri, "/");
        }

        // --- DEBUG (Nếu vẫn lỗi thì bỏ comment 2 dòng dưới để xem nó đang nhận được gì) ---
        // echo json_encode(["debug_url" => $url]); return;
        // --------------------------------------------------------------------------------

        // Lấy method GET/POST
        $method = $_SERVER['REQUEST_METHOD'];

        // Nếu URL rỗng → không có route nào
        if ($url === "") {
            echo json_encode([
                "status" => false,
                "message" => "Không tìm thấy route (URL rỗng)"
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

        // Lấy controller và method
        list($controllerName, $methodName) = explode("@", $this->routes[$method][$url]);

        // Load file controller
        $file = __DIR__ . "/../controllers/" . $controllerName . ".php";
        if (!file_exists($file)) {
            echo json_encode(["status" => false, "message" => "Không tìm thấy controller: $controllerName"]);
            return;
        }
        require_once $file;

        // Khởi tạo controller
        $controller = new $controllerName();

        // Gọi hàm xử lý
        if (!method_exists($controller, $methodName)) {
            echo json_encode(["status" => false, "message" => "Hàm xử lý không tồn tại: $methodName"]);
            return;
        }

        $controller->$methodName();
    }
}
