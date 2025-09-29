-- 1. Nhận yêu cầu và hiểu rõ vấn đề

-- 2. Thiết kế database để đáp ứng 100% yêu cầu (nghĩ đơn giản nhất)

-- 3. Đánh giá mô database về hiệu xuất, khả năng mở rộng

-- 4. Thiết kế lại database hoặc nâng cấp database ở bước 2 lên



CREATE TABLE `USER` (
	`_id` TINYINT NOT NULL AUTO_INCREMENT UNIQUE,
	`created_at` DATE,
	`updated_at` DATE,
	`name` VARCHAR(255),
	`email` VARCHAR(255) UNIQUE,
	`password` VARCHAR(255),
	`day_of_birth` DATE,
	`email_verify_token` VARCHAR(255),
	`forgot_password_token` VARCHAR(255),
	`verify` ENUM(),
	`bio` VARCHAR(255),
	`location` VARCHAR(255),
	`website` VARCHAR(255),
	`username` VARCHAR(255) UNIQUE,
	`avatar` VARCHAR(255),
	`cover_photo` VARCHAR(255),
	`follower_count` INTEGER,
	`following_count` INTEGER,
	`isFollow` BOOLEAN,
	PRIMARY KEY(`_id`)
);


CREATE TABLE `REFRESH` (
	`_id` TINYINT NOT NULL AUTO_INCREMENT UNIQUE,
	`created_at` DATE,
	`updated_at` DATE,
	`token` VARCHAR(255) UNIQUE,
	`user_id` TINYINT,
	`iat` DATE,
	`exp` DATE,
	PRIMARY KEY(`_id`)
);


CREATE TABLE `NOTIFICATION` (
	`_id` TINYINT NOT NULL AUTO_INCREMENT UNIQUE,
	`created_at` DATE,
	`updated_at` DATE,
	`content` VARCHAR(255),
	`type` ENUM(),
	`sender` TINYINT,
	`receiver` TINYINT,
	`isRead` BOOLEAN,
	`refId` TINYINT COMMENT 'Là ObjectId của những đối tượng của thông báo',
	PRIMARY KEY(`_id`)
);


CREATE TABLE `CONVERSATION` (
	`_id` TINYINT NOT NULL AUTO_INCREMENT UNIQUE,
	`created_at` DATE,
	`updated_at` DATE,
	`name` VARCHAR(255),
	`avatar` VARCHAR(255),
	`type` ENUM(),
	`participants` TINYINT COMMENT 'Danh sách người tham gia cuộc trò chuyện ObjectId[]',
	`lastMessage` TINYINT,
	`readStatus` TINYINT COMMENT 'Danh sách những người chưa đọc',
	PRIMARY KEY(`_id`)
);


CREATE TABLE `MESSAGE` (
	`_id` TINYINT NOT NULL AUTO_INCREMENT UNIQUE,
	`created_at` DATE,
	`updated_at` DATE,
	`sender` TINYINT,
	`conversation` TINYINT,
	`content` VARCHAR(255),
	`attachments` JSON,
	PRIMARY KEY(`_id`)
);


CREATE TABLE `TWEET` (
	`_id` TINYINT NOT NULL AUTO_INCREMENT UNIQUE,
	`created_at` DATE,
	`updated_at` DATE,
	`user_id` TINYINT,
	`type` ENUM(),
	`audience` ENUM(),
	`content` VARCHAR(255),
	`parent_id` TINYINT,
	`hashtags` TINYINT COMMENT 'ObjectId[] của table hashtag',
	`mentions` TINYINT COMMENT 'ObjectId[] của table User',
	`media` JSON,
	`guest_view` INTEGER,
	`user_view` INTEGER,
	`likes_count` INTEGER,
	`comments_count` INTEGER,
	`shares_count` INTEGER,
	`retweets_count` INTEGER,
	`quotes_count` INTEGER,
	`isLike` BOOLEAN,
	`isBookmark` BOOLEAN,
	`retweet` TINYINT COMMENT 'ObjectId của reTweet',
	`quote` TINYINT COMMENT 'ObjectId của quoteTweet',
	`total_views` INTEGER,
	PRIMARY KEY(`_id`)
);


CREATE TABLE `HASHTAG` (
	`_id` TINYINT NOT NULL AUTO_INCREMENT UNIQUE,
	`created_at` DATE,
	`updated_at` DATE,
	`name` VARCHAR(255),
	`slug` VARCHAR(255),
	PRIMARY KEY(`_id`)
);


CREATE TABLE `BOOKMARK` (
	`_id` TINYINT NOT NULL AUTO_INCREMENT UNIQUE,
	`created_at` DATE,
	`updated_at` DATE,
	`user_id` TINYINT,
	`tweet_id` TINYINT,
	PRIMARY KEY(`_id`)
);


CREATE TABLE `LIKE` (
	`_id` TINYINT NOT NULL AUTO_INCREMENT UNIQUE,
	`created_at` DATE,
	`updated_at` DATE,
	`user_id` TINYINT,
	`tweet_id` TINYINT,
	PRIMARY KEY(`_id`)
);


CREATE TABLE `FOLLOW` (
	`_id` TINYINT NOT NULL AUTO_INCREMENT UNIQUE,
	`created_at` DATE,
	`updated_at` DATE,
	`user_id` TINYINT,
	`followed_user_id` TINYINT,
	PRIMARY KEY(`_id`)
);


CREATE TABLE `TRENDING` (
	`_id` TINYINT NOT NULL AUTO_INCREMENT UNIQUE,
	`created_at` DATE,
	`updated_at` DATE,
	`keyword` VARCHAR(255),
	`slug` VARCHAR(255),
	`hashtag` TINYINT,
	`count` INTEGER COMMENT 'Số lượng lượt tìm kiếm hoặc bài viết đã đăng',
	PRIMARY KEY(`_id`)
);


CREATE TABLE `VIDEO` (
	`_id` TINYINT NOT NULL AUTO_INCREMENT UNIQUE,
	`created_at` DATE,
	`updated_at` DATE,
	`name` VARCHAR(255),
	`size` INTEGER,
	`status` ENUM(),
	`user_id` TINYINT,
	PRIMARY KEY(`_id`)
);


ALTER TABLE `REFRESH`
ADD FOREIGN KEY(`user_id`) REFERENCES `USER`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `NOTIFICATION`
ADD FOREIGN KEY(`sender`) REFERENCES `USER`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `NOTIFICATION`
ADD FOREIGN KEY(`receiver`) REFERENCES `USER`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `CONVERSATION`
ADD FOREIGN KEY(`participants`) REFERENCES `USER`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `CONVERSATION`
ADD FOREIGN KEY(`readStatus`) REFERENCES `USER`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `MESSAGE`
ADD FOREIGN KEY(`sender`) REFERENCES `USER`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `MESSAGE`
ADD FOREIGN KEY(`conversation`) REFERENCES `CONVERSATION`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `TWEET`
ADD FOREIGN KEY(`user_id`) REFERENCES `USER`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `TWEET`
ADD FOREIGN KEY(`parent_id`) REFERENCES `TWEET`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `TWEET`
ADD FOREIGN KEY(`mentions`) REFERENCES `USER`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `TWEET`
ADD FOREIGN KEY(`retweet`) REFERENCES `TWEET`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `TWEET`
ADD FOREIGN KEY(`quote`) REFERENCES `TWEET`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `HASHTAG`
ADD FOREIGN KEY(`_id`) REFERENCES `TWEET`(`hashtags`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `BOOKMARK`
ADD FOREIGN KEY(`user_id`) REFERENCES `USER`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `BOOKMARK`
ADD FOREIGN KEY(`tweet_id`) REFERENCES `TWEET`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `LIKE`
ADD FOREIGN KEY(`user_id`) REFERENCES `USER`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `LIKE`
ADD FOREIGN KEY(`tweet_id`) REFERENCES `TWEET`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `FOLLOW`
ADD FOREIGN KEY(`user_id`) REFERENCES `USER`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `FOLLOW`
ADD FOREIGN KEY(`followed_user_id`) REFERENCES `USER`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `TRENDING`
ADD FOREIGN KEY(`hashtag`) REFERENCES `HASHTAG`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `VIDEO`
ADD FOREIGN KEY(`user_id`) REFERENCES `USER`(`_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;