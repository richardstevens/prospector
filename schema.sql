-- MySQL dump 10.13  Distrib 5.7.21, for osx10.12 (x86_64)
--
-- Host: 109.203.126.210    Database: prospector
-- ------------------------------------------------------
-- Server version	5.6.38

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `keywords` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `login`
--

DROP TABLE IF EXISTS `login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `login` (
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `token` varchar(255) DEFAULT NULL,
  `attempts` int(2) DEFAULT '0',
  `company` varchar(255) NOT NULL DEFAULT 'test',
  `level` int(1) NOT NULL DEFAULT '0',
  `lastlogin` datetime DEFAULT CURRENT_TIMESTAMP,
  `tokenexpiry` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`email`),
  KEY `company` (`company`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `projects` (
  `keyword` varchar(255) NOT NULL,
  `timestamp` varchar(14) NOT NULL DEFAULT '',
  PRIMARY KEY (`keyword`,`timestamp`),
  KEY `keyword` (`keyword`),
  KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `runs`
--

DROP TABLE IF EXISTS `runs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `runs` (
  `keyword` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  `timestamp` varchar(14) NOT NULL DEFAULT '',
  `title` varchar(255) DEFAULT '',
  `position` int(100) NOT NULL DEFAULT '100',
  PRIMARY KEY (`keyword`,`url`),
  KEY `keyword` (`keyword`),
  KEY `url` (`url`),
  KEY `position` (`position`),
  KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scrapes`
--

DROP TABLE IF EXISTS `scrapes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `scrapes` (
  `url` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT '',
  `email` varchar(255) DEFAULT '',
  `phone` varchar(255) DEFAULT '',
  `facebook` varchar(255) DEFAULT '',
  `twitter` varchar(255) DEFAULT '',
  `linkedin` varchar(255) DEFAULT '',
  `form` int(1) NOT NULL DEFAULT '0',
  `ahrefRank` int(10) DEFAULT '0',
  `domainRank` int(3) DEFAULT '0',
  `urlRank` int(3) DEFAULT '0',
  `referringDomains` int(10) DEFAULT '0',
  `backlinks` int(10) DEFAULT '0',
  `linkedDomains` int(10) DEFAULT '0',
  `brokenLinks` int(10) DEFAULT '0',
  `organicKeywords` int(10) DEFAULT '0',
  `twitterCount` int(10) DEFAULT '0',
  `facebookCount` int(10) DEFAULT '0',
  `pinterestCount` int(10) DEFAULT '0',
  PRIMARY KEY (`url`),
  KEY `email` (`email`),
  KEY `phone` (`phone`),
  KEY `facebook` (`facebook`),
  KEY `twitter` (`twitter`),
  KEY `linkedin` (`linkedin`),
  KEY `form` (`form`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-03-30 12:27:12
