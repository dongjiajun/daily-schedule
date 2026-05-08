package com.dailyschedule.domain.event;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository {
    List<Event> findByRange(LocalDateTime start, LocalDateTime end);
    List<Event> findByRangeAndCategory(LocalDateTime start, LocalDateTime end, Long categoryId);
    Optional<Event> findById(Long id);
    Event save(Event event);
    void delete(Long id);
    List<Event> findUpcoming(LocalDateTime now, LocalDateTime threshold);
}
