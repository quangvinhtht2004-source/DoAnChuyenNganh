-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jan 12, 2026 at 03:25 PM
-- Server version: 8.4.7
-- PHP Version: 8.2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `quanlybansach`
--

-- --------------------------------------------------------

--
-- Table structure for table `chitietdonhang`
--

DROP TABLE IF EXISTS `chitietdonhang`;
CREATE TABLE IF NOT EXISTS `chitietdonhang` (
  `CTDH_ID` int NOT NULL AUTO_INCREMENT,
  `DonHangID` int NOT NULL,
  `SachID` int DEFAULT NULL,
  `SoLuong` int NOT NULL,
  `DonGia` decimal(18,2) NOT NULL,
  PRIMARY KEY (`CTDH_ID`),
  KEY `DonHangID` (`DonHangID`),
  KEY `SachID` (`SachID`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chitietdonhang`
--

INSERT INTO `chitietdonhang` (`CTDH_ID`, `DonHangID`, `SachID`, `SoLuong`, `DonGia`) VALUES
(76, 55, 97, 5, 212500.00);

-- --------------------------------------------------------

--
-- Table structure for table `donhang`
--

DROP TABLE IF EXISTS `donhang`;
CREATE TABLE IF NOT EXISTS `donhang` (
  `DonHangID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `DiaChiGiao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoDienThoai` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `GhiChu` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `PhuongThucTT` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COD',
  `TrangThai` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'ChoXacNhan',
  `ThanhToan` tinyint DEFAULT '0',
  `TongTien` decimal(18,2) NOT NULL,
  `TienGiamVoucher` decimal(18,2) DEFAULT '0.00',
  `KhuyenMaiID` int DEFAULT NULL,
  `NgayTao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`DonHangID`),
  KEY `UserID` (`UserID`),
  KEY `KhuyenMaiID` (`KhuyenMaiID`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `donhang`
--

INSERT INTO `donhang` (`DonHangID`, `UserID`, `DiaChiGiao`, `SoDienThoai`, `GhiChu`, `PhuongThucTT`, `TrangThai`, `ThanhToan`, `TongTien`, `TienGiamVoucher`, `KhuyenMaiID`, `NgayTao`) VALUES
(55, 34, '180 Cao Lỗ, P.4, Q.8, TP.HCM', '0707189144', '[NHẬN TẠI CỬA HÀNG] Người nhận: Vinh. Note:  | Email: Quangvinhtht2004@gmail.com', 'STORE', 'ChoXacNhan', 0, 903125.00, 159375.00, 5, '2026-01-12 21:24:06');

-- --------------------------------------------------------

--
-- Table structure for table `donhanglog`
--

DROP TABLE IF EXISTS `donhanglog`;
CREATE TABLE IF NOT EXISTS `donhanglog` (
  `LogID` int NOT NULL AUTO_INCREMENT,
  `DonHangID` int NOT NULL,
  `UserID` int DEFAULT NULL,
  `TrangThaiCu` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TrangThaiMoi` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `GhiChu` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayCapNhat` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`LogID`),
  KEY `DonHangID` (`DonHangID`),
  KEY `UserID` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `giohang`
--

DROP TABLE IF EXISTS `giohang`;
CREATE TABLE IF NOT EXISTS `giohang` (
  `GioHangID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `NgayCapNhat` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`GioHangID`),
  KEY `UserID` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `giohang`
--

INSERT INTO `giohang` (`GioHangID`, `UserID`, `NgayCapNhat`) VALUES
(4, 7, '2025-12-21 17:36:13'),
(12, 34, '2026-01-05 22:51:26');

-- --------------------------------------------------------

--
-- Table structure for table `giohangitem`
--

DROP TABLE IF EXISTS `giohangitem`;
CREATE TABLE IF NOT EXISTS `giohangitem` (
  `ItemID` int NOT NULL AUTO_INCREMENT,
  `GioHangID` int NOT NULL,
  `SachID` int NOT NULL,
  `SoLuong` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`ItemID`),
  KEY `GioHangID` (`GioHangID`),
  KEY `SachID` (`SachID`)
) ENGINE=InnoDB AUTO_INCREMENT=119 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `giohangitem`
--

INSERT INTO `giohangitem` (`ItemID`, `GioHangID`, `SachID`, `SoLuong`) VALUES
(44, 4, 2, 50);

-- --------------------------------------------------------

--
-- Table structure for table `khuyenmai`
--

DROP TABLE IF EXISTS `khuyenmai`;
CREATE TABLE IF NOT EXISTS `khuyenmai` (
  `KhuyenMaiID` int NOT NULL AUTO_INCREMENT,
  `Code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `LoaiKM` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'phantram',
  `GiaTri` decimal(18,2) NOT NULL,
  `DonToiThieu` decimal(18,2) DEFAULT '0.00',
  `SoLuong` int DEFAULT '0',
  `NgayKetThuc` datetime DEFAULT NULL,
  `TrangThai` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1: Hoạt động, 0: Hết hạn',
  PRIMARY KEY (`KhuyenMaiID`),
  UNIQUE KEY `UNIQUE_CODE` (`Code`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `khuyenmai`
--

INSERT INTO `khuyenmai` (`KhuyenMaiID`, `Code`, `LoaiKM`, `GiaTri`, `DonToiThieu`, `SoLuong`, `NgayKetThuc`, `TrangThai`) VALUES
(5, 'TET2026', 'phantram', 15.00, 100000.00, 44, '2026-02-28 23:59:59', 1),
(7, 'FLASHSALE', 'phantram', 50.00, 500000.00, 10, '2025-12-31 16:33:48', 1),
(9, 'GIAM30K', 'tien', 30000.00, 0.00, 96, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `nhaxuatban`
--

DROP TABLE IF EXISTS `nhaxuatban`;
CREATE TABLE IF NOT EXISTS `nhaxuatban` (
  `NhaXuatBanID` int NOT NULL AUTO_INCREMENT,
  `TenNhaXuatBan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`NhaXuatBanID`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `nhaxuatban`
--

INSERT INTO `nhaxuatban` (`NhaXuatBanID`, `TenNhaXuatBan`) VALUES
(1, 'NXB Tổng Hợp'),
(2, 'NXB Thế Giới'),
(3, 'NXB Văn Học'),
(4, 'NXB Hà Nội'),
(5, 'NXB Phụ Nữ'),
(7, 'NXB Kim Đồng'),
(8, 'NXB Trẻ');

-- --------------------------------------------------------

--
-- Table structure for table `review`
--

DROP TABLE IF EXISTS `review`;
CREATE TABLE IF NOT EXISTS `review` (
  `ReviewID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `SachID` int NOT NULL,
  `SoSao` int DEFAULT NULL,
  `BinhLuan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `TrangThai` tinyint DEFAULT '1',
  `NgayDanhGia` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ReviewID`),
  KEY `UserID` (`UserID`),
  KEY `SachID` (`SachID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `review`
--

INSERT INTO `review` (`ReviewID`, `UserID`, `SachID`, `SoSao`, `BinhLuan`, `TrangThai`, `NgayDanhGia`) VALUES
(4, 34, 100, 5, 'hay quá', 1, '2026-01-12 20:10:44');

-- --------------------------------------------------------

--
-- Table structure for table `sach`
--

DROP TABLE IF EXISTS `sach`;
CREATE TABLE IF NOT EXISTS `sach` (
  `SachID` int NOT NULL AUTO_INCREMENT,
  `TenSach` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TacGiaID` int DEFAULT NULL,
  `NhaXuatBanID` int DEFAULT NULL,
  `TheLoaiID` int DEFAULT NULL,
  `Gia` decimal(18,2) NOT NULL,
  `PhanTramGiam` int DEFAULT '0',
  `MoTa` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `AnhBia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `AnhPhu1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `AnhPhu2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `RatingTB` float DEFAULT '0',
  `SoDanhGia` int DEFAULT '0',
  `TrangThai` tinyint DEFAULT '1',
  `NgayTao` datetime DEFAULT CURRENT_TIMESTAMP,
  `SoLuong` int DEFAULT '0',
  PRIMARY KEY (`SachID`),
  KEY `TacGiaID` (`TacGiaID`),
  KEY `NhaXuatBanID` (`NhaXuatBanID`),
  KEY `TheLoaiID` (`TheLoaiID`)
) ENGINE=InnoDB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sach`
--

INSERT INTO `sach` (`SachID`, `TenSach`, `TacGiaID`, `NhaXuatBanID`, `TheLoaiID`, `Gia`, `PhanTramGiam`, `MoTa`, `AnhBia`, `AnhPhu1`, `AnhPhu2`, `RatingTB`, `SoDanhGia`, `TrangThai`, `NgayTao`, `SoLuong`) VALUES
(1, 'Đắc Nhân Tâm', 9, 1, 1, 95000.00, 0, 'Nghệ thuật thu phục lòng người', 'dacnhantam.jpg', 'dacnhantam_1.jpg', 'dacnhantam_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 90),
(2, 'Quẳng Gánh Lo Đi Và Vui Sống', 15, 2, 1, 90000.00, 15, 'Cách để vượt qua lo âu trong cuộc sống', 'quangganhlo.jpg', 'quangganhlo_1.jpg', 'quangganhlo_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 45),
(3, 'Đánh Thức Con Người Phi Thường', 9, 3, 1, 170000.00, 10, 'Khám phá tiềm năng bản thân', 'danhthuc.jpg', 'danhthuc_1.jpg', 'danhthuc_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 78),
(4, '7 Thói Quen Hiệu Quả', 9, 4, 1, 120000.00, 25, 'Những thói quen của người thành đạt', '7thoiquen.jpg', '7thoiquen_1.jpg', '7thoiquen_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 55),
(5, 'Khéo Ăn Nói Sẽ Có Được Thiên Hạ', 5, 1, 1, 79000.00, 0, 'Kỹ năng giao tiếp đỉnh cao', 'kheoannoi.jpg', 'kheoannoi_1.jpg', 'kheoannoi_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 200),
(6, 'Tuổi Trẻ Đáng Giá Bao Nhiêu', 11, 8, 1, 85000.00, 30, 'Cuốn sách truyền cảm hứng cho giới trẻ', 'tuoitre.jpg', 'tuoitre_1.jpg', 'tuoitre_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 149),
(7, 'Đời Thay Đổi Khi Chúng Ta Thay Đổi', 4, 5, 1, 65000.00, 0, 'Tư duy tích cực để hạnh phúc', 'doithaydoi.jpg', 'doithaydoi_1.jpg', 'doithaydoi_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 90),
(8, 'Nhà Lãnh Đạo Không Chức Danh', 9, 2, 1, 99000.00, 10, 'Kỹ năng lãnh đạo bản thân', 'nhalanhdao.jpg', 'nhalanhdao_1.jpg', 'nhalanhdao_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 45),
(9, 'Tĩnh Lặng', 11, 3, 1, 55000.00, 5, 'Sức mạnh của sự tĩnh lặng', 'tinhlang.jpg', 'tinhlang_1.jpg', 'tinhlang_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 70),
(10, 'Hiểu Về Trái Tim', 9, 8, 1, 130000.00, 15, 'Nghệ thuật sống hạnh phúc', 'hieuvetraitim.jpg', 'hieuvetraitim_1.jpg', 'hieuvetraitim_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 120),
(11, 'Hành Trình Về Phương Đông', 6, 1, 3, 110000.00, 0, 'Khám phá bí ẩn tâm linh Ấn Độ', 'hanhtrinh.jpg', 'hanhtrinh_1.jpg', 'hanhtrinh_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 100),
(12, 'Muôn Kiếp Nhân Sinh', 6, 1, 3, 168000.00, 10, 'Luật nhân quả và luân hồi', 'muonkiep1.jpg', 'muonkiep1_1.jpg', 'muonkiep1_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 200),
(13, 'Muôn Kiếp Nhân Sinh 2', 6, 1, 3, 178000.00, 10, 'Tiếp nối hành trình tâm linh', 'muonkiep2.jpg', 'muonkiep2_1.jpg', 'muonkiep2_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 150),
(14, 'Dấu Chân Trên Cát', 6, 2, 3, 90000.00, 20, 'Tiểu thuyết tâm linh Ai Cập', 'dauchan.jpg', 'dauchan_1.jpg', 'dauchan_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 80),
(15, 'Nhật Ký Tarot', 5, 5, 3, 399000.00, 5, 'Hướng dẫn bói bài Tarot', 'tarot.webp', 'tarot_1.webp', 'tarot_2.webp', 0, 0, 1, '2025-12-27 15:25:16', 37),
(16, 'Trở Về Từ Cõi Sáng', 6, 3, 3, 75000.00, 0, 'Trải nghiệm cận tử', 'trove.jpg', 'trove_1.jpg', 'trove_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 60),
(17, 'Tạng Thư Sống Chết', 6, 4, 3, 210000.00, 15, 'Triết lý Phật giáo Tây Tạng', 'tangthu.jpg', 'tangthu_1.jpg', 'tangthu_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 30),
(18, 'Sức Mạnh Của Hiện Tại', 6, 2, 3, 115000.00, 10, 'Sống trọn vẹn từng khoảnh khắc', 'sucmanh.jpg', 'sucmanh_1.jpg', 'sucmanh_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 90),
(19, 'Thiền Và Nghệ Thuật Hạnh Phúc', 11, 8, 3, 68000.00, 0, 'Ứng dụng thiền vào cuộc sống', 'thien.jpg', 'thien_1.jpg', 'thien_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 110),
(20, 'Lối Sống Tối Giản Của Người Nhật', 11, 5, 3, 85000.00, 25, 'Tâm linh trong lối sống', 'toigian.jpg', 'toigian_1.jpg', 'toigian_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 130),
(21, 'Tư Duy Nhanh Và Chậm', 4, 2, 4, 180000.00, 20, 'Hai hệ thống tư duy của con người', 'tuduynhanhcham.jpg', 'tuduynhanhcham_1.jpg', 'tuduynhanhcham_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 50),
(22, 'Tâm Lý Học Đám Đông', 3, 1, 4, 95000.00, 0, 'Nghiên cứu về tâm lý xã hội', 'damdong.jpg', 'damdong_1.jpg', 'damdong_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 70),
(23, 'Phi Lý Trí', 3, 3, 4, 110000.00, 15, 'Những hành vi phi lý của con người', 'philytri.jpg', 'philytri_1.jpg', 'philytri_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 60),
(24, 'Thiên Tài Bên Trái Kẻ Điên Bên Phải', 4, 4, 4, 125000.00, 10, 'Góc nhìn từ những người điên', 'thientai.jpg', 'thientai_1.jpg', 'thientai_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 90),
(25, 'Thao Túng Tâm Lý', 11, 1, 4, 135000.00, 5, 'Nhận diện và phòng tránh thao túng', 'thaotung.jpg', 'thaotung_1.jpg', 'thaotung_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 100),
(26, 'Đọc Vị Bất Kỳ Ai', 7, 5, 4, 89000.00, 10, 'Kỹ năng nhìn người', 'docvi.png', 'docvi_1.png', 'docvi_2.png', 0, 0, 1, '2025-12-27 15:25:16', 150),
(27, 'Sức Mạnh Của Thói Quen', 9, 2, 4, 140000.00, 20, 'Cơ chế hình thành thói quen', 'thoiquen.jpg', 'thoiquen_1.jpg', 'thoiquen_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 80),
(28, 'Chú Chó Nhìn Thấy Gì', 6, 8, 4, 105000.00, 0, 'Góc nhìn lạ về các vấn đề xã hội', 'chucho.jpg', 'chucho_1.jpg', 'chucho_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 40),
(29, 'Hướng Nội', 4, 1, 4, 98000.00, 15, 'Sức mạnh của người trầm lặng', 'huongnoi.jpg', 'huongnoi_1.jpg', 'huongnoi_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 120),
(30, 'Tâm Lý Học Tội Phạm', 7, 3, 4, 150000.00, 10, 'Phân tích tâm lý tội phạm', 'toipham.jpg', 'toipham_1.jpg', 'toipham_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 200),
(31, 'Dế Mèn Phiêu Lưu Ký', 12, 7, 5, 45000.00, 0, 'Truyện đồng thoại Việt Nam', 'demen.jpg', 'demen_1.jpg', 'demen_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 200),
(32, 'Kính Vạn Hoa', 12, 7, 5, 80000.00, 10, 'Truyện dài học đường', 'kinhvanhoa.jpg', 'kinhvanhoa_1.jpg', 'kinhvanhoa_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 150),
(33, 'Đất Rừng Phương Nam', 12, 7, 5, 75000.00, 5, 'Thiên nhiên và con người Nam Bộ', 'datrung.jpg', 'datrung_1.jpg', 'datrung_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 100),
(34, 'Chuyện Con Mèo Dạy Hải Âu Bay', 15, 1, 5, 55000.00, 20, 'Câu chuyện cảm động về lời hứa', 'haiau.jpg', 'haiau_1.jpg', 'haiau_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 120),
(35, 'Hoàng Tử Bé', 15, 2, 5, 60000.00, 0, 'Câu chuyện triết lý cho trẻ em', 'hoangtube.jpg', 'hoangtube_1.jpg', 'hoangtube_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 300),
(36, 'Một Ngày Của Bút Chì', 8, 7, 5, 59000.00, 0, 'Truyện tranh thiếu nhi dễ thương', 'butchi.webp', 'butchi_1.webp', 'butchi_2.webp', 0, 0, 1, '2025-12-27 15:25:16', 80),
(37, 'Cây Cam Ngọt Của Tôi', 5, 1, 5, 72000.00, 15, 'Tiểu thuyết cảm động về tuổi thơ', 'caycamngot.jpg', 'caycamngot_1.jpg', 'caycamngot_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 250),
(38, 'Pippi Tất Dài', 8, 5, 5, 68000.00, 10, 'Cô bé tinh nghịch và mạnh mẽ', 'pippi.jpg', 'pippi_1.jpg', 'pippi_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 90),
(39, 'Totto-chan Bên Cửa Sổ', 15, 1, 5, 85000.00, 10, 'Nền giáo dục tuyệt vời', 'tottochan.jpg', 'tottochan_1.jpg', 'tottochan_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 110),
(40, 'Alice Ở Xứ Sở Diệu Kỳ', 15, 3, 5, 90000.00, 20, 'Cuộc phiêu lưu vào thế giới giả tưởng', 'alice.jpg', 'alice_1.jpg', 'alice_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 70),
(41, 'Nhà Giả Kim', 6, 1, 6, 79000.00, 10, 'Hành trình tìm kiếm kho báu', 'nhagiakim.jpg', 'nhagiakim_1.jpg', 'nhagiakim_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 500),
(42, 'Rừng Nauy', 15, 1, 6, 120000.00, 15, 'Tiểu thuyết tình yêu Nhật Bản', 'rungnauy.jpg', 'rungnauy_1.jpg', 'rungnauy_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 150),
(43, 'Giết Con Chim Nhại', 3, 3, 6, 99000.00, 0, 'Tác phẩm kinh điển văn học Mỹ', 'gietconchim.jpg', 'gietconchim_1.jpg', 'gietconchim_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 100),
(44, 'Mắt Biếc', 12, 8, 6, 110000.00, 20, 'Tình yêu đơn phương buồn', 'matbiec.jpg', 'matbiec_1.jpg', 'matbiec_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 200),
(45, 'Bố Già', 16, 4, 6, 145000.00, 10, 'Tiểu thuyết về Mafia', 'bogia.jpg', 'bogia_1.jpg', 'bogia_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 120),
(46, 'Đồi Gió Hú', 3, 2, 6, 105000.00, 5, 'Tình yêu và sự trả thù', 'doigiohu.jpg', 'doigiohu_1.jpg', 'doigiohu_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 80),
(47, 'Kiêu Hãnh Và Định Kiến', 3, 5, 6, 95000.00, 15, 'Văn học cổ điển Anh', 'kieuhanh.jpg', 'kieuhanh_1.jpg', 'kieuhanh_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 130),
(48, 'Trăm Năm Cô Đơn', 6, 1, 6, 160000.00, 10, 'Hiện thực huyền ảo', 'tramnam.jpg', 'tramnam_1.jpg', 'tramnam_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 60),
(49, 'Người Đua Diều', 3, 1, 6, 115000.00, 20, 'Câu chuyện về tình bạn và chuộc lỗi', 'nguoiduadieu.jpg', 'nguoiduadieu_1.jpg', 'nguoiduadieu_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 90),
(50, 'Đại Gia Gatsby', 3, 2, 6, 88000.00, 0, 'Giấc mơ Mỹ tan vỡ', 'gatsby.jpg', 'gatsby_1.jpg', 'gatsby_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 110),
(51, 'IT (Gã Hề Ma Quái)', 3, 1, 7, 250000.00, 10, 'Nỗi sợ hãi từ chú hề', 'it.jpg', 'it_1.jpg', 'it_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 50),
(52, 'The Shining', NULL, 1, 7, 180000.00, 15, 'Khách sạn ma ám', 'shining.jpg', 'shining_1.jpg', 'shining_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 60),
(53, 'Tiếng Gọi Cthulhu', 5, 2, 7, 120000.00, 0, 'Kinh dị vũ trụ Lovecraft', 'cthulhu.jpg', 'cthulhu_1.jpg', 'cthulhu_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 80),
(54, 'Dracula', 3, 3, 7, 95000.00, 20, 'Bá tước ma cà rồng', 'dracula.jpg', 'dracula_1.jpg', 'dracula_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 100),
(55, 'Sự Im Lặng Của Bầy Cừu', 7, 1, 7, 135000.00, 10, 'Tâm lý tội phạm kinh dị', 'imlang.jpg', 'imlang_1.jpg', 'imlang_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 120),
(56, 'Kỳ Án Ánh Trăng', 4, 5, 7, 110000.00, 5, 'Trinh thám kinh dị Trung Quốc', 'anhtrang.jpg', 'anhtrang_1.jpg', 'anhtrang_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 90),
(57, 'Đề Thi Đẫm Máu', 4, 5, 7, 125000.00, 10, 'Vụ án liên hoàn đáng sợ', 'dethidammau.jpg', 'dethidammau_1.jpg', 'dethidammau_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 110),
(58, 'Hồ Sơ Bí Ẩn', 4, 4, 7, 140000.00, 15, 'Những vụ án siêu nhiên', 'hosobian.jpg', 'hosobian_1.jpg', 'hosobian_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 70),
(59, 'Tấm Vải Đỏ', 4, 2, 7, 98000.00, 0, 'Lời nguyền dòng họ', 'tamvaido.jpg', 'tamvaido_1.jpg', 'tamvaido_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 85),
(60, 'Ring (Vòng Tròn Ác Nghiệt)', 3, 1, 7, 105000.00, 20, 'Cuốn băng video bị nguyền rủa', 'ring.jpg', 'ring_1.jpg', 'ring_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 95),
(61, 'Toán Cao Cấp A1', 11, 4, 8, 65000.00, 0, 'Giáo trình đại học', 'toana1.jpg', 'toana1_1.jpg', 'toana1_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 500),
(62, 'Vật Lý Đại Cương', 11, 4, 8, 70000.00, 0, 'Giáo trình vật lý cơ bản', 'vatly.jpg', 'vatly_1.jpg', 'vatly_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 400),
(63, 'Kinh Tế Vĩ Mô', 6, 1, 8, 85000.00, 10, 'Nguyên lý kinh tế học', 'vimo.jpg', 'vimo_1.jpg', 'vimo_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 300),
(64, 'Kinh Tế Vi Mô 2', 6, 1, 8, 85000.00, 10, 'Kinh tế học căn bản', 'vimo1.jpg', 'vimo_1_1.jpg', 'vimo_2_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 300),
(65, 'Marketing Căn Bản', 9, 1, 8, 120000.00, 15, 'Nhập môn Marketing', 'marketing.jpg', 'marketing_1.jpg', 'marketing_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 250),
(66, 'Lập Trình C++', 11, 4, 8, 95000.00, 5, 'Kỹ thuật lập trình cơ sở', 'cplusplus.jpg', 'cplusplus_1.jpg', 'cplusplus_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 200),
(67, 'Cấu Trúc Dữ Liệu & Giải Thuật', 11, 4, 8, 100000.00, 0, 'Nền tảng khoa học máy tính', 'cautruc.jpg', 'cautruc_1.jpg', 'cautruc_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 150),
(68, 'Tiếng Anh Thương Mại', 11, 2, 8, 150000.00, 20, 'Giao tiếp trong kinh doanh', 'businesseng.jpg', 'businesseng_1.jpg', 'businesseng_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 180),
(69, 'Pháp Luật Đại Cương', 11, 4, 8, 55000.00, 0, 'Kiến thức pháp luật cơ bản', 'phapluat.jpg', 'phapluat_1.jpg', 'phapluat_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 450),
(70, 'Tư Tưởng Hồ Chí Minh', 11, 4, 8, 40000.00, 0, 'Giáo trình chính trị', 'tutuong.jpg', 'tutuong_1.jpg', 'tutuong_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 600),
(71, 'Sherlock Holmes Toàn Tập', 3, 3, 9, 250000.00, 30, 'Thám tử lừng danh', 'sherlock.jpg', 'sherlock_1.jpg', 'sherlock_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 100),
(72, 'Án Mạng Trên Chuyến Tàu Tốc Hành', 3, 1, 9, 110000.00, 10, 'Agatha Christie kinh điển', 'tauphuongdong.jpg', 'tauphuongdong_1.jpg', 'tauphuongdong_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 119),
(73, 'Mười Người Da Đen Nhỏ', 3, 1, 9, 105000.00, 15, 'Vụ án trên đảo hoang', '10nguoi.jpg', '10nguoi_1.jpg', '10nguoi_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 110),
(74, 'Phía Sau Nghi Can X', 15, 1, 9, 130000.00, 10, 'Trinh thám Nhật Bản', 'nghicanx.jpg', 'nghicanx_1.jpg', 'nghicanx_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 90),
(75, 'Bạch Dạ Hành', NULL, 1, 9, 155000.00, 5, 'Câu chuyện ám ảnh', 'bachdahanh.jpg', 'bachdahanh_1.jpg', 'bachdahanh_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 79),
(76, 'Mật Mã Da Vinci', NULL, 2, 9, 160000.00, 20, 'Bí ẩn tôn giáo', 'davinci.jpg', 'davinci_1.jpg', 'davinci_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 100),
(77, 'Cô Gái Có Hình Xăm Rồng', NULL, 5, 9, 145000.00, 10, 'Trinh thám Bắc Âu', 'hinhxamrong.jpg', 'hinhxamrong_1.jpg', 'hinhxamrong_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 70),
(78, 'Sự Thật Về Vụ Án Harry Quebert', NULL, 1, 9, 170000.00, 15, 'Vụ án chôn vùi 30 năm', 'harry.jpg', 'harry_1.jpg', 'harry_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 60),
(79, 'Hỏa Ngục', NULL, 2, 9, 150000.00, 25, 'Chạy đua với thời gian', 'hoanguc.jpg', 'hoanguc_1.jpg', 'hoanguc_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 90),
(80, 'Chim Sẻ Đỏ', NULL, 3, 9, 115000.00, 0, 'Điệp viên trinh thám', 'chimsedo.jpg', 'chimsedo_1.jpg', 'chimsedo_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 50),
(81, 'Doraemon Tập 1', 8, 7, 10, 25000.00, 0, 'Mèo máy thông minh', 'doraemon1.jpg', 'doraemon1_1.jpg', 'doraemon1_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 500),
(82, 'Conan Tập 100', 8, 7, 10, 25000.00, 0, 'Thám tử lừng danh', 'conan100.jpg', 'conan100_1.jpg', 'conan100_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 400),
(83, 'One Piece Tập 99', 8, 7, 10, 25000.00, 0, 'Vua hải tặc', 'onepiece.jpg', 'onepiece_1.jpg', 'onepiece_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 450),
(84, 'Dragon Ball Super', 8, 7, 10, 30000.00, 0, '7 viên ngọc rồng', 'dragonball.jpg', 'dragonball_1.jpg', 'dragonball_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 300),
(85, 'Naruto Tập Cuối', 8, 7, 10, 25000.00, 0, 'Ninja Làng Lá', 'naruto.jpg', 'naruto_1.jpg', 'naruto_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 250),
(86, 'Thần Đồng Đất Việt', 8, 7, 10, 20000.00, 0, 'Truyện tranh Việt Nam', 'thandong.jpg', 'thandong_1.jpg', 'thandong_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 200),
(87, 'Shin Cậu Bé Bút Chì', 8, 7, 10, 25000.00, 0, 'Hài hước đời thường', 'shin.jpg', 'shin_1.jpg', 'shin_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 350),
(88, 'Attack On Titan', 8, 8, 10, 50000.00, 0, 'Đại chiến Titan', 'aot.jpg', 'aot_1.jpg', 'aot_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 150),
(89, 'Spy x Family', 8, 7, 10, 45000.00, 10, 'Gia đình điệp viên', 'spyxfamily.jpg', 'spyxfamily_1.jpg', 'spyxfamily_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 180),
(90, 'Thanh Gươm Diệt Quỷ', 8, 7, 10, 35000.00, 0, 'Kimetsu no Yaiba', 'kimetsu.jpg', 'kimetsu_1.jpg', 'kimetsu_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 220),
(91, 'Vợ Nhặt', 3, 3, 11, 45000.00, 0, 'Truyện ngắn Kim Lân', 'vonhat.jpg', 'vonhat_1.jpg', 'vonhat_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 100),
(92, 'Chí Phèo', 3, 3, 11, 50000.00, 0, 'Nam Cao tuyển tập', 'chipheo.jpg', 'chipheo_1.jpg', 'chipheo_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 119),
(93, 'Tắt Đèn', 3, 3, 11, 55000.00, 10, 'Tiểu thuyết Ngô Tất Tố', 'tatden.jpg', 'tatden_1.jpg', 'tatden_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 90),
(94, 'Số Đỏ', 3, 3, 11, 60000.00, 10, 'Vũ Trọng Phụng', 'sodo.jpg', 'sodo_1.jpg', 'sodo_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 80),
(95, 'Dế Mèn Phiêu Lưu Ký', 12, 7, 11, 45000.00, 0, 'Tô Hoài', 'demen_vh.jpg', 'demen_vh_1.jpg', 'demen_vh_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 150),
(96, 'Những Người Khốn Khổ', 3, 1, 11, 200000.00, 20, 'Victor Hugo', 'khonkho.jpg', 'khonkho_1.jpg', 'khonkho_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 57),
(97, 'Chiến Tranh Và Hòa Bình', 3, 2, 11, 250000.00, 15, 'Leo Tolstoy', 'chientranh.jpg', 'chientranh_1.jpg', 'chientranh_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 45),
(98, 'Ông Già Và Biển Cả', 3, 1, 11, 70000.00, 0, 'Hemingway', 'onggia.jpg', 'onggia_1.jpg', 'onggia_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 84),
(99, 'Đất Rừng Phương Nam', 12, 3, 11, 75000.00, 5, 'Đoàn Giỏi', 'datrung_vh.jpg', 'datrung_vh_1.jpg', 'datrung_vh_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 77),
(100, 'Truyện Kiều', 3, 1, 11, 90000.00, 10, 'Truyện Kiều của Nguyễn Du là kiệt tác văn học đỉnh cao, nổi bật với giá trị nhân đạo sâu sắc (thương cảm người tài hoa bạc mệnh, đề cao giá trị con người), nghệ thuật xây dựng nhân vật độc đáo (chính diện ước lệ, phản diện tả thực, lột tả nội tâm tinh tế), và ngôn ngữ thơ lục bát mẫu mực (kết hợp Hán-Việt, dân gian, tinh tế, giàu sức biểu cảm), tạo nên một tiểu thuyết tâm lý bằng thơ độc nhất vô nhị, phản ánh hiện thực xã hội phong kiến đầy bi kịch nhưng vẫn ngợi ca sức sống mãnh liệt của con người. ', 'truyenkieu.jpg', 'truyenkieu_1.jpg', 'truyenkieu_2.jpg', 0, 0, 1, '2025-12-27 15:25:16', 110);

-- --------------------------------------------------------

--
-- Table structure for table `tacgia`
--

DROP TABLE IF EXISTS `tacgia`;
CREATE TABLE IF NOT EXISTS `tacgia` (
  `TacGiaID` int NOT NULL AUTO_INCREMENT,
  `TenTacGia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`TacGiaID`),
  UNIQUE KEY `TenTacGia` (`TenTacGia`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tacgia`
--

INSERT INTO `tacgia` (`TacGiaID`, `TenTacGia`) VALUES
(10, 'Đức Anh'),
(9, 'Hamlet Trương'),
(4, 'Nam Cao'),
(6, 'Nguyễn Bỉnh Khiêm'),
(3, 'Nguyễn Du'),
(15, 'Nguyễn Ngọc Thạch'),
(7, 'Nguyễn Ngọc Tư'),
(12, 'Nguyễn Nhật Ánh'),
(16, 'Phan Ý Yên'),
(11, 'Rosie Nguyễn'),
(5, 'Trần Hằng'),
(8, 'Yoon Mi');

-- --------------------------------------------------------

--
-- Table structure for table `theloai`
--

DROP TABLE IF EXISTS `theloai`;
CREATE TABLE IF NOT EXISTS `theloai` (
  `TheLoaiID` int NOT NULL AUTO_INCREMENT,
  `TenTheLoai` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`TheLoaiID`),
  UNIQUE KEY `TenTheLoai` (`TenTheLoai`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `theloai`
--

INSERT INTO `theloai` (`TheLoaiID`, `TenTheLoai`) VALUES
(7, 'Kinh dị'),
(1, 'Kỹ năng sống'),
(8, 'Sách giáo trình'),
(3, 'Tâm linh'),
(4, 'Tâm lý học'),
(5, 'Thiếu nhi'),
(6, 'Tiểu thuyết'),
(9, 'Trinh thám'),
(10, 'Truyện tranh'),
(11, 'Văn học');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `HoTen` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MatKhau` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoDienThoai` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `VaiTro` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'KhachHang',
  `TrangThai` tinyint(1) DEFAULT '1',
  `NgayTao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Email` (`Email`),
  UNIQUE KEY `UNIQUE_SDT` (`SoDienThoai`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserID`, `HoTen`, `Email`, `MatKhau`, `SoDienThoai`, `VaiTro`, `TrangThai`, `NgayTao`) VALUES
(7, 'Admin01', 'admin1@gmail.com', '$2y$10$O/8yk6MkU7SlHuIfFlXqreOE7T1hW6UVBGYP.wa8YPINDQTyVvVgS', '0123456789', 'QuanTri', 1, '2025-12-21 17:35:45'),
(34, 'Vinh', 'Quangvinhtht2004@gmail.com', '$2y$10$R40W/pxDuP7ywIPxRwdnaeSNucOsT2unVwrvM/BLgWs5iUZkuZaCq', '0707189144', 'KhachHang', 1, '2026-01-05 21:54:19');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chitietdonhang`
--
ALTER TABLE `chitietdonhang`
  ADD CONSTRAINT `chitietdonhang_ibfk_1` FOREIGN KEY (`DonHangID`) REFERENCES `donhang` (`DonHangID`) ON DELETE CASCADE,
  ADD CONSTRAINT `chitietdonhang_ibfk_2` FOREIGN KEY (`SachID`) REFERENCES `sach` (`SachID`) ON DELETE SET NULL;

--
-- Constraints for table `donhang`
--
ALTER TABLE `donhang`
  ADD CONSTRAINT `donhang_ibfk_2` FOREIGN KEY (`KhuyenMaiID`) REFERENCES `khuyenmai` (`KhuyenMaiID`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_donhang_users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE RESTRICT;

--
-- Constraints for table `donhanglog`
--
ALTER TABLE `donhanglog`
  ADD CONSTRAINT `donhanglog_ibfk_1` FOREIGN KEY (`DonHangID`) REFERENCES `donhang` (`DonHangID`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_log_users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL;

--
-- Constraints for table `giohang`
--
ALTER TABLE `giohang`
  ADD CONSTRAINT `fk_giohang_users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `giohangitem`
--
ALTER TABLE `giohangitem`
  ADD CONSTRAINT `giohangitem_ibfk_1` FOREIGN KEY (`GioHangID`) REFERENCES `giohang` (`GioHangID`) ON DELETE CASCADE,
  ADD CONSTRAINT `giohangitem_ibfk_2` FOREIGN KEY (`SachID`) REFERENCES `sach` (`SachID`) ON DELETE CASCADE;

--
-- Constraints for table `review`
--
ALTER TABLE `review`
  ADD CONSTRAINT `fk_review_users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE,
  ADD CONSTRAINT `review_ibfk_2` FOREIGN KEY (`SachID`) REFERENCES `sach` (`SachID`) ON DELETE CASCADE;

--
-- Constraints for table `sach`
--
ALTER TABLE `sach`
  ADD CONSTRAINT `sach_ibfk_1` FOREIGN KEY (`TacGiaID`) REFERENCES `tacgia` (`TacGiaID`) ON DELETE SET NULL,
  ADD CONSTRAINT `sach_ibfk_2` FOREIGN KEY (`NhaXuatBanID`) REFERENCES `nhaxuatban` (`NhaXuatBanID`) ON DELETE SET NULL,
  ADD CONSTRAINT `sach_ibfk_3` FOREIGN KEY (`TheLoaiID`) REFERENCES `theloai` (`TheLoaiID`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
