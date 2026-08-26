-- 微信小程序登录：user 表加 openid（可空，唯一索引允许多个 NULL —— Web 老用户不受影响）
ALTER TABLE `user` ADD COLUMN openid VARCHAR(64) NULL AFTER id;
ALTER TABLE `user` ADD UNIQUE KEY uk_user_openid (openid);
