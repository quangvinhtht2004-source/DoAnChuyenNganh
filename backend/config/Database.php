<?php
class Database {
    private $host = "localhost";
    private $db_name = "quanlybansach";
    private $username = "root";
    private $password = "";
    public $conn;

    public function connect() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8");
        } catch (PDOException $e) {
            die(json_encode(["status" => false, "message" => "DB Error: " . $e->getMessage()]));
        }

        return $this->conn;
    }
}
