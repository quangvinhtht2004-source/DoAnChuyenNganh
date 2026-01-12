<?php
class Controller {
    protected function json($data) {
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
