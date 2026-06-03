-- v3.0: 完善用户表 + 业务表多用户隔离收口
-- V2 已经建好 user 表 + 业务表的 user_id 列；本迁移：
--   1) 给 user 表补齐 email / display_name / avatar_url / status / last_login_at 列
--   2) 用户名/邮箱建唯一索引
--   3) category / tag 加 (user_id, name) 唯一约束，禁止用户内同名
--   4) event 主查询索引升级为 (user_id, start_time, end_time) 复合索引

-- 1) user 表补字段
ALTER TABLE `user` ADD COLUMN email         VARCHAR(120) NULL AFTER username;
ALTER TABLE `user` ADD COLUMN display_name  VARCHAR(50)  NULL AFTER password_hash;
ALTER TABLE `user` ADD COLUMN avatar_url    VARCHAR(255) NULL AFTER display_name;
ALTER TABLE `user` ADD COLUMN status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' AFTER avatar_url;
ALTER TABLE `user` ADD COLUMN last_login_at DATETIME     NULL AFTER status;

-- 默认 admin 用户补一个占位邮箱（admin@local），以满足唯一索引非空数据要求
UPDATE `user` SET email = CONCAT(username, '@local') WHERE email IS NULL;

-- 邮箱改为非空 + 唯一
ALTER TABLE `user` MODIFY COLUMN email VARCHAR(120) NOT NULL;
CREATE UNIQUE INDEX uk_user_email ON `user` (email);

-- 2) category / tag 加 (user_id, name) 唯一约束（用户内同名禁止）
CREATE UNIQUE INDEX uk_category_user_name ON category (user_id, name);
CREATE UNIQUE INDEX uk_tag_user_name      ON tag      (user_id, name);

-- 3) event 复合索引（按用户范围查询提速）
CREATE INDEX idx_event_user_time ON event (user_id, start_time, end_time);
