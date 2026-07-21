-- v3.3: 任务看板模块 — 任务表 + 任务标签关联表
-- Phase 1 情感核心 M1.5 — 首个新业务模块

CREATE TABLE tasks (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'TODO',
    priority    VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM',
    sort_order  INT          NOT NULL DEFAULT 0,
    due_date    DATE,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_tasks_user_status (user_id, status),
    INDEX idx_tasks_user_priority (user_id, priority),
    CONSTRAINT chk_tasks_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    CONSTRAINT chk_tasks_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE task_tags (
    task_id BIGINT NOT NULL,
    tag_id  BIGINT NOT NULL,
    PRIMARY KEY (task_id, tag_id),
    INDEX idx_task_tags_tag (tag_id),
    CONSTRAINT fk_task_tags_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_tags_tag FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
