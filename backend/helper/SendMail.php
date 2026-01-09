<?php
// backend/helper/SendMail.php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../libs/PHPMailer/Exception.php';
require_once __DIR__ . '/../libs/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../libs/PHPMailer/SMTP.php';

class SendMail {
    public static function send($toEmail, $subject, $body) {
        $mail = new PHPMailer(true);

        try {
            // Tắt Debug để trả về JSON sạch cho Frontend
            $mail->SMTPDebug = 0; 
            
            // Cấu hình Server
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            
            // ⚠️ THÔNG TIN GMAIL CỦA BẠN
            $mail->Username   = 'quangvinhtht2004@gmail.com';
            
            // [ĐÃ SỬA] Mật khẩu chính xác từ ảnh (chữ 'i' ngắn, không phải 'l')
            // Tôi đã xóa khoảng trắng để đảm bảo không bị lỗi
            $mail->Password   = 'wyjvuljtxnvqiydm'; 
            
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;
            $mail->CharSet    = 'UTF-8';

            // Fix lỗi SSL trên Localhost (WampServer)
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );

            // Người gửi & Người nhận
            $mail->setFrom('quangvinhtht2004@gmail.com', 'VKD BookStore');
            $mail->addAddress($toEmail);
            $mail->addReplyTo('quangvinhtht2004@gmail.com', 'VKD BookStore Support');

            // Nội dung email
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;
            $mail->AltBody = strip_tags($body);

            $mail->send();
            return true;
            
        } catch (Exception $e) {
            // Ghi log lỗi vào file của server thay vì hiện ra màn hình
            error_log("Mailer Error: " . $mail->ErrorInfo);
            return false;
        }
    }
}
?>