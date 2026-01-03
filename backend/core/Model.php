<?php
class Model {
    protected $db;

    // Model cần nhận biến kết nối CSDL từ bên ngoài truyền vào
    public function __construct($db) {
        $this->db = $db;
    }
}
?>