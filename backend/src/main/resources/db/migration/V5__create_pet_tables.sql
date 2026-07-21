-- v3.2: 宠物养成系统 — 宠物主表 + 物品目录 + 互动记录
-- Phase 1 情感核心 M1.1 — 用户与宠物一对一

CREATE TABLE pet_accessories (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(50)  NOT NULL,
    type             VARCHAR(20)  NOT NULL COMMENT 'FOOD / ACCESSORY',
    price            INT          NOT NULL,
    effect_mood      INT          NOT NULL DEFAULT 0,
    effect_hunger    INT          NOT NULL DEFAULT 0,
    effect_experience INT         NOT NULL DEFAULT 0,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pets (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT       NOT NULL,
    species             VARCHAR(20)  NOT NULL COMMENT 'ORANGE_CAT / SHIBA_INU',
    name                VARCHAR(30)  NOT NULL,
    experience          INT          NOT NULL DEFAULT 0,
    level               INT          NOT NULL DEFAULT 1,
    mood                INT          NOT NULL DEFAULT 100,
    hunger              INT          NOT NULL DEFAULT 100,
    coins               INT          NOT NULL DEFAULT 100,
    current_accessory   BIGINT       DEFAULT NULL,
    last_interacted_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_pet_user (user_id),
    CONSTRAINT fk_pet_accessory FOREIGN KEY (current_accessory) REFERENCES pet_accessories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pet_interactions (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    pet_id           BIGINT       NOT NULL,
    type             VARCHAR(20)  NOT NULL COMMENT 'FEED / PLAY',
    quantity         INT          NOT NULL DEFAULT 1,
    mood_change      INT          NOT NULL DEFAULT 0,
    hunger_change    INT          NOT NULL DEFAULT 0,
    experience_gain  INT          NOT NULL DEFAULT 0,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_interaction_pet (pet_id),
    INDEX idx_interaction_time (pet_id, created_at),
    CONSTRAINT fk_interaction_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 种子数据：6 种初始商品（v1 仅 FOOD 类型，ACCESSORY 留待 Phase 2）
INSERT INTO pet_accessories (name, type, price, effect_mood, effect_hunger, effect_experience) VALUES
('小鱼干',   'FOOD', 10,  5, 20,  3),
('高级猫粮', 'FOOD', 25, 10, 40,  8),
('狗粮',     'FOOD', 15,  8, 30,  5),
('磨牙棒',   'FOOD', 20,  8, 25,  6),
('优质罐头', 'FOOD', 35, 15, 50, 10),
('玩具球',   'FOOD',  5, 15,  0,  5);
