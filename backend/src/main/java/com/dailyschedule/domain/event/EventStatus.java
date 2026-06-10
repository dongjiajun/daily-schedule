package com.dailyschedule.domain.event;

/**
 * 日程状态。
 * <ul>
 *   <li>{@link #PLANNED} — 计划中（默认）：参与提醒与冲突检测。</li>
 *   <li>{@link #COMPLETED} — 已完成：不再提醒，不参与冲突检测。</li>
 *   <li>{@link #CANCELLED} — 已取消：不再提醒，不参与冲突检测。</li>
 * </ul>
 */
public enum EventStatus {
    PLANNED,
    COMPLETED,
    CANCELLED;

    public static EventStatus fromString(String value) {
        if (value == null || value.isBlank()) return PLANNED;
        return EventStatus.valueOf(value);
    }
}
