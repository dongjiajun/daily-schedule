-- 提醒幂等支持：记录每个事件最近一次成功推送提醒的时间。
-- 调度器在每次触发前比对该字段，避免在 ±30 秒窗口内重复发送。
ALTER TABLE event
    ADD COLUMN last_reminded_at DATETIME NULL AFTER category_id;
