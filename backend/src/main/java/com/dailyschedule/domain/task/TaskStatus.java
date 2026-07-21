package com.dailyschedule.domain.task;

/**
 * 任务状态。
 * <ul>
 *   <li>{@link #TODO} — 待办：新建任务的默认状态。</li>
 *   <li>{@link #IN_PROGRESS} — 进行中：用户已开始处理该任务。</li>
 *   <li>{@link #DONE} — 已完成：任务归档，不显示在默认视图中。</li>
 * </ul>
 */
public enum TaskStatus {
    TODO,
    IN_PROGRESS,
    DONE;

    public static TaskStatus fromString(String value) {
        if (value == null || value.isBlank()) return TODO;
        return TaskStatus.valueOf(value);
    }
}
