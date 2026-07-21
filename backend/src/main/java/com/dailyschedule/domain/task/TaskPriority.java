package com.dailyschedule.domain.task;

/**
 * 任务优先级。
 * <ul>
 *   <li>{@link #LOW} — 低优先级。</li>
 *   <li>{@link #MEDIUM} — 中等优先级（默认）。</li>
 *   <li>{@link #HIGH} — 高优先级。</li>
 *   <li>{@link #URGENT} — 紧急。</li>
 * </ul>
 */
public enum TaskPriority {
    LOW,
    MEDIUM,
    HIGH,
    URGENT;

    public static TaskPriority fromString(String value) {
        if (value == null || value.isBlank()) return MEDIUM;
        return TaskPriority.valueOf(value);
    }
}
