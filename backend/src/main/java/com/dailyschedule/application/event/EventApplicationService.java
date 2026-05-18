package com.dailyschedule.application.event;

import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.domain.event.Event;
import com.dailyschedule.domain.event.EventDomainService;
import com.dailyschedule.domain.event.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventApplicationService {

    private final EventRepository eventRepository;
    private final EventDomainService domainService;

    public EventApplicationService(EventRepository eventRepository, EventDomainService domainService) {
        this.eventRepository = eventRepository;
        this.domainService = domainService;
    }

    public PagedEvents listByRange(LocalDateTime start, LocalDateTime end, Long categoryId,
                                   Long userId, String keyword, int page, int size) {
        List<Event> events;
        long total;
        if (categoryId != null) {
            events = eventRepository.findByRangeAndCategory(start, end, categoryId, userId, keyword, page, size);
            total = eventRepository.countByRangeAndCategory(start, end, categoryId, userId, keyword);
        } else {
            events = eventRepository.findByRange(start, end, userId, keyword, page, size);
            total = eventRepository.countByRange(start, end, userId, keyword);
        }
        return new PagedEvents(events, total, page, size);
    }

    public Event getById(Long id, Long userId) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("日程不存在: " + id));
        if (!event.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("日程不存在: " + id);
        }
        return event;
    }

    @Transactional
    public Event create(Event event) {
        if (!event.isValid()) {
            throw new IllegalArgumentException("日程数据不合法：标题和时间为必填");
        }
        List<Event> existing = eventRepository.findByRange(
            event.getStartTime().minusMinutes(1), event.getEndTime().plusMinutes(1),
            event.getUserId(), null, 1, 1000);
        if (domainService.hasTimeConflict(event, existing)) {
            throw new IllegalArgumentException("该时段已有其他日程，请调整时间");
        }
        return eventRepository.save(event);
    }

    @Transactional
    public Event update(Long id, Event data, Long userId) {
        Event existing = getById(id, userId);
        existing.update(data);
        if (!existing.isValid()) {
            throw new IllegalArgumentException("更新后日程数据不合法");
        }
        return eventRepository.save(existing);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        getById(id, userId);
        eventRepository.delete(id);
    }

    public record PagedEvents(List<Event> events, long total, int page, int size) {}
}
