-- 微信登录静默注册：微信用户无邮箱，email 允许 NULL（可空列 UNIQUE 允许多个 NULL，Web 老用户语义不变）
ALTER TABLE `user` MODIFY COLUMN email VARCHAR(120) NULL;
