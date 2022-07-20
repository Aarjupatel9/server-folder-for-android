-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 20, 2022 at 09:54 AM
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
(6355710630, '123', 4, 'mhk', 0),
(2389474323, '123', 6, 'unknown', 0);

-- --------------------------------------------------------

--
-- Table structure for table `massege`
--

CREATE TABLE `massege` (
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `massage` varchar(1000) NOT NULL,
  `View_Status` int(11) NOT NULL,
  `localDatabase_Status` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `massege`
--

INSERT INTO `massege` (`sender_id`, `receiver_id`, `massage`, `View_Status`, `localDatabase_Status`) VALUES
(1, 2, 'hii i am aarju', 0, 1),
(1, 2, 'hello dear', 0, 1),
(1, 2, 'hmmm', 0, 1),
(2, 1, 'hhhhhhhhiiiii', 0, 1),
(1, 4, 'hello friends how are you?', 0, 1),
(1, 4, 'hello friends how are you?', 0, 1),
(1, 3, 'hello friends how are you?', 0, 1),
(1, 3, 'hello friends how are you?', 0, 1),
(1, 3, 'hello friends how are you?', 0, 1),
(1, 3, 'hello friends how are you?', 0, 1),
(1, 3, 'test', 0, 1),
(1, 3, 'test', 0, 1),
(1, 4, 'test', 0, 1),
(1, 4, 'test', 0, 1),
(1, 4, 'test', 0, 1),
(1, 4, 'test', 0, 1),
(1, 4, 'test', 0, 1),
(1, 4, 'test', 0, 1),
(1, 4, 'tedt', 0, 1),
(1, 4, 'tedt', 0, 1),
(1, 1, 'hxucchcchc', 0, 1),
(1, 1, 'hxucchcchc', 0, 1),
(1, 1, 'kvivbbkobo', 0, 1),
(1, 1, 'kvivbbkobo', 0, 1),
(1, 1, 'ghfdhhh', 0, 1),
(1, 1, 'ghfdhhh', 0, 1),
(1, 1, 'yfffufufg', 0, 1),
(1, 1, 'yfffufufg', 0, 1),
(1, 3, 'civvuvg', 0, 1),
(1, 3, 'civvuvg', 0, 1),
(1, 4, 'teast jjhhh', 0, 1),
(1, 4, 'teast jjhhh', 0, 1),
(1, 4, 'jchxchccccjcjcivcivivi', 0, 1),
(1, 4, 'jchxchccccjcjcivcivivi', 0, 1),
(1, 3, 'gfzzzjznnznsns', 0, 1),
(1, 3, 'gfzzzjznnznsns', 0, 1),
(1, 3, 'bbxbxbsns', 0, 1),
(1, 3, 'bbxbxbsns', 0, 1),
(1, 3, 'nvkcjvjcuc', 0, 1),
(1, 3, 'nvkcjvjcuc', 0, 1),
(1, 3, 'fccf', 0, 1),
(1, 3, 'fccf', 0, 1),
(1, 4, ' uccuvikv', 0, 1),
(1, 4, 'vkvkkv', 0, 1),
(1, 4, 'hello friends how are you?', 0, 1),
(1, 4, 'cjvikvklbll56729262628181', 0, 1),
(1, 1, 'juuggfghgffthg', 0, 1);

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
('massege_table', '2022-07-12 14:15:10');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `login_info`
--
ALTER TABLE `login_info`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `table_versions`
--
ALTER TABLE `table_versions`
  ADD PRIMARY KEY (`table_name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `login_info`
--
ALTER TABLE `login_info`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
