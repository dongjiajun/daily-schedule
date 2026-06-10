package com.dailyschedule.domain.event;

/**
 * 日程范围查询的可选过滤条件。新增过滤维度时在此扩展，
 * 避免仓储接口方法签名持续膨胀。
 */
public record EventFilter(Long categoryId, Long tagId, EventStatus status, String keyword) {

    public static final EventFilter NONE = new EventFilter(null, null, null, null);

    public static EventFilter byKeyword(String keyword) {
        return new EventFilter(null, null, null, keyword);
    }
}
