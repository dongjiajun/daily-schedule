-- v3.4: 宠物经济闭环 — 行为奖励发放记录（幂等键防重复刷币）
-- M2.4 商店前置：专注币收入来源

CREATE TABLE pet_rewards (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    pet_id           BIGINT       NOT NULL,
    source           VARCHAR(32)  NOT NULL COMMENT 'TASK_COMPLETED / EVENT_COMPLETED / EVENT_CANCELLED / FOCUS_COMPLETED / DAILY_CHECKIN / HABIT_CHECKED',
    ref_id           VARCHAR(64)  NOT NULL,
    coin_change      INT          NOT NULL DEFAULT 0,
    experience_gain  INT          NOT NULL DEFAULT 0,
    mood_change      INT          NOT NULL DEFAULT 0,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_reward_pet_source_ref (pet_id, source, ref_id),
    CONSTRAINT fk_reward_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
