-- v3.5: 宠物装扮系统 — 11 个节日配饰种子（购买即装备，无库存）
-- 名称与 packages/shared/src/holiday/themeMapping.ts 的 petAccessory 声明逐一对齐
-- 价格档位：皮肤 80 / 背包 50 / 帽子 40 / 角·耳·发饰 30（经济闭环奖励量级：任务 +10 / 日程 +20）

INSERT INTO pet_accessories (name, type, price, effect_mood, effect_hunger, effect_experience) VALUES
('年兽皮肤',   'ACCESSORY', 80, 0, 0, 0),
('麋鹿角',     'ACCESSORY', 30, 0, 0, 0),
('巫师帽',     'ACCESSORY', 40, 0, 0, 0),
('玉兔皮肤',   'ACCESSORY', 80, 0, 0, 0),
('粽子背包',   'ACCESSORY', 50, 0, 0, 0),
('新年帽',     'ACCESSORY', 40, 0, 0, 0),
('火鸡帽',     'ACCESSORY', 40, 0, 0, 0),
('绿帽子',     'ACCESSORY', 30, 0, 0, 0),
('樱花发饰',   'ACCESSORY', 30, 0, 0, 0),
('印度象皮肤', 'ACCESSORY', 80, 0, 0, 0),
('兔耳朵',     'ACCESSORY', 30, 0, 0, 0);
