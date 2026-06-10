-- v3.1: 日程状态字段
-- PLANNED（默认）/ COMPLETED / CANCELLED；支持"标记完成"闭环。
ALTER TABLE event ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PLANNED' AFTER reminder_minutes;
