-- 添加用户表
CREATE TABLE `user` (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 所有业务表添加 user_id 外键
ALTER TABLE event ADD COLUMN user_id BIGINT;
ALTER TABLE category ADD COLUMN user_id BIGINT;
ALTER TABLE tag ADD COLUMN user_id BIGINT;

-- 提醒幂等支持
ALTER TABLE event ADD COLUMN last_reminded_at DATETIME NULL AFTER category_id;

-- 创建默认管理员用户 (admin/admin123)
INSERT INTO `user` (id, username, password_hash) VALUES (1, 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

-- 存量数据挂到默认用户
UPDATE event SET user_id = 1 WHERE user_id IS NULL;
UPDATE category SET user_id = 1 WHERE user_id IS NULL;
UPDATE tag SET user_id = 1 WHERE user_id IS NULL;

-- user_id 设为 NOT NULL
ALTER TABLE event MODIFY user_id BIGINT NOT NULL;
ALTER TABLE category MODIFY user_id BIGINT NOT NULL;
ALTER TABLE tag MODIFY user_id BIGINT NOT NULL;

-- 索引
ALTER TABLE event ADD INDEX idx_event_user (user_id);
ALTER TABLE category ADD INDEX idx_category_user (user_id);
ALTER TABLE tag ADD INDEX idx_tag_user (user_id);
