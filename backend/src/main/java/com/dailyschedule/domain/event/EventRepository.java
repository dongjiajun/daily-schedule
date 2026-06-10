package com.dailyschedule.domain.event;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository {
    List<Event> findByRange(LocalDateTime start, LocalDateTime end, Long userId, EventFilter filter, int page, int size);
    long countByRange(LocalDateTime start, LocalDateTime end, Long userId, EventFilter filter);
    Optional<Event> findById(Long id);
    Event save(Event event);
    void delete(Long id);

    /** 查询 [now, threshold] 内开始、设置了提醒且仍处于 PLANNED 状态的日程。 */
    List<Event> findUpcoming(LocalDateTime now, LocalDateTime threshold);

    /**
     * 将事件标记为已提醒。
     * @param id 事件 ID
     * @param remindedAt 提醒发生时间
     */
    void markReminded(Long id, LocalDateTime remindedAt);
}
