-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 01, 2022 at 10:34 PM
-- Server version: 10.4.24-MariaDB
-- PHP Version: 8.1.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `android_studio`
--

-- --------------------------------------------------------

--
-- Table structure for table `login_info`
--

CREATE TABLE `login_info` (
  `user_number` bigint(20) NOT NULL,
  `userPassword` varchar(50) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `Account_status` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `login_info`
--

INSERT INTO `login_info` (`user_number`, `userPassword`, `user_id`, `name`, `Account_status`) VALUES
(6353884460, '123', 1, 'Aarju patel', 0),
(9904935123, '123', 2, 'aman patel', 0),
(9624179170, '123', 3, 'papa', 0),
(1010101010, '123', 6, 'mhk', 0),
(1234567890, '123', 11, 'pixel 3 xl', 0),
(8758234096, '123', 12, 'sagar', 0),
(2222222222, '123', 14, 'd2', 0),
(3333333333, '123', 16, 'd3', 0),
(4444444444, '123', 17, 'd4', 0),
(5555555555, '123', 18, 'd5', 0),
(6666666666, '123', 19, 'd6', 0),
(1111111111, '123', 22, 'd1', 0);

-- --------------------------------------------------------

--
-- Table structure for table `massege`
--

CREATE TABLE `massege` (
  `massege_number` bigint(20) UNSIGNED NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `chat_id` int(11) NOT NULL DEFAULT -1,
  `massage` varchar(1000) NOT NULL,
  `massege_sent_time` bigint(20) NOT NULL DEFAULT 0,
  `View_Status` int(11) NOT NULL,
  `localDatabase_Status` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `massege`
--

INSERT INTO `massege` (`massege_number`, `sender_id`, `receiver_id`, `chat_id`, `massage`, `massege_sent_time`, `View_Status`, `localDatabase_Status`) VALUES
(417, 6, 1, 1, 'hii\n', 20220828154516, 0, 1),
(418, 1, 6, 2, 'hgg', 20220828154704, 0, 1),
(419, 1, 1, 14, 'hshshhs', 20220828180143, 0, 1),
(420, 1, 1, 15, 'jshshhe', 20220828180146, 0, 1),
(421, 1, 1, 18, 'jsjs\nnsns\n', 20220828180158, 0, 1),
(422, 1, 1, 19, 'hsjs', 20220828180201, 0, 1),
(423, 1, 6, 6, 'hii', 20220902004150, 0, 1),
(424, 1, 6, 7, 'ggf', 0, 0, 1),
(425, 1, 6, 8, 'javab de ne', 0, 0, 1),
(426, 1, 6, 9, 'bas have', 0, 0, 1),
(427, 1, 6, 19, 'su che pan', 1662059926220, 0, 1),
(428, 1, 6, 26, 'ha bol have ', 1662060034900, 0, 1),
(429, 1, 6, 11, 'hii', 1662061278890, 0, 0),
(430, 1, 6, 12, 'hi', 1662061283067, 0, 0),
(431, 1, 6, 23, 'hllllo', 1662061433224, 0, 0),
(432, 1, 1, 24, 'hii', 1662061438563, 0, 0),
(433, 1, 1, 25, 'vxsd', 1662061441194, 0, 0),
(434, 1, 11, 28, 'gf', 1662061463505, 0, 0),
(435, 1, 6, 36, 'hhii', 1662061717523, 0, 0),
(436, 1, 6, 37, 'xs', 1662061718778, 0, 0),
(437, 1, 1, 38, 'nhg', 1662061733680, 0, 0),
(438, 6, 1, 7, 'ddf', 1662061824743, 0, 0),
(439, 6, 1, 8, 'tdg', 1662061834549, 0, 0),
(440, 1, 6, 11, 'hii', 1662062584021, 0, 0),
(441, 6, 1, 16, 'fgy', 1662062594021, 0, 0),
(442, 1, 6, 12, 'hu', 1662062987255, 0, 0),
(443, 6, 1, 28, 'hiiiiiiiiiiiiiiiiiiiiiiiiii', 1662063043602, 0, 0),
(444, 1, 6, 26, 'Hello ', 1662063068787, 0, 0),
(445, 1, 6, 27, 'hgf', 1662063070662, 0, 0),
(446, 1, 6, 28, 'hgf', 1662063072175, 0, 0),
(447, 6, 1, 31, 'hiiiiiiiiiiiiiiiii', 1662063082813, 0, 0),
(448, 1, 6, 43, 'hhh', 1662063385756, 0, 0),
(449, 1, 6, 44, 'hii', 1662063392455, 0, 0),
(450, 1, 6, 45, 'gg', 1662063394188, 0, 0),
(451, 1, 6, 46, 'gh', 1662063396932, 0, 0),
(452, 6, 1, 38, 'vff', 1662063401909, 0, 0),
(453, 6, 1, 39, 'uu', 1662063403530, 0, 0),
(454, 6, 1, 40, 'jjjj', 1662063405667, 0, 0);

--
-- Triggers `massege`
--
DELIMITER $$
CREATE TRIGGER `after_insert_in_login_info` AFTER INSERT ON `massege` FOR EACH ROW REPLACE INTO table_versions VALUES('massege_table', CURRENT_TIMESTAMP)
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `table_versions`
--

CREATE TABLE `table_versions` (
  `table_name` varchar(50) NOT NULL,
  `version` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `table_versions`
--

INSERT INTO `table_versions` (`table_name`, `version`) VALUES
('massege_table', '2022-09-01 20:16:46');

-- --------------------------------------------------------

--
-- Table structure for table `user_info`
--

CREATE TABLE `user_info` (
  `user_id` int(11) NOT NULL,
  `last_online_time` bigint(20) UNSIGNED DEFAULT 0,
  `online_status` tinyint(4) NOT NULL DEFAULT 0,
  `online_status_privacy` tinyint(4) NOT NULL DEFAULT 0,
  `display_name` varchar(50) DEFAULT NULL,
  `about` varchar(140) NOT NULL DEFAULT 'be nice to everyone'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `user_info`
--

INSERT INTO `user_info` (`user_id`, `last_online_time`, `online_status`, `online_status_privacy`, `display_name`, `about`) VALUES
(1, 1662063739556, 1, 0, 'Aarju ', 'hello '),
(6, 1662063742159, 1, 0, NULL, 'be nice to everyone'),
(2, 1661047510901, 0, 0, NULL, 'be nice to everyone'),
(22, 20220831003932, 0, 1, NULL, 'be nice to everyone'),
(3, 1662056016049, 0, 0, NULL, 'be nice to everyone'),
(11, 1662057510901, 0, 0, NULL, 'be nice to everyone'),
(12, 20220830235401, 0, 0, NULL, 'be nice to everyone'),
(14, 20220830235401, 0, 0, NULL, 'be nice to everyone'),
(16, 20220830235426, 0, 0, NULL, 'be nice to everyone'),
(17, 20220830235426, 0, 0, NULL, 'be nice to everyone'),
(18, 20220830235426, 0, 0, NULL, 'be nice to everyone'),
(19, 20220830235426, 0, 0, NULL, 'be nice to everyone');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `login_info`
--
ALTER TABLE `login_info`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `massege`
--
ALTER TABLE `massege`
  ADD PRIMARY KEY (`massege_number`);

--
-- Indexes for table `table_versions`
--
ALTER TABLE `table_versions`
  ADD PRIMARY KEY (`table_name`);

--
-- Indexes for table `user_info`
--
ALTER TABLE `user_info`
  ADD KEY `fk_userId_cosnsta` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `login_info`
--
ALTER TABLE `login_info`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `massege`
--
ALTER TABLE `massege`
  MODIFY `massege_number` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=455;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `user_info`
--
ALTER TABLE `user_info`
  ADD CONSTRAINT `fk_userId_cosnsta` FOREIGN KEY (`user_id`) REFERENCES `login_info` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
