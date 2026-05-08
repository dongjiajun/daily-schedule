package com.dailyschedule.application.event;

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

    public List<Event> listByRange(LocalDateTime start, LocalDateTime end, Long categoryId) {
        if (categoryId != null) {
            return eventRepository.findByRangeAndCategory(start, end, categoryId);
        }
        return eventRepository.findByRange(start, end);
    }

    public Event getById(Long id) {
        return eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("日程不存在: " + id));
    }

    @Transactional
    public Event create(Event event) {
        if (!event.isValid()) {
            throw new IllegalArgumentException("日程数据不合法：标题和时间为必填");
        }
        List<Event> existing = eventRepository.findByRange(
            event.getStartTime().minusMinutes(1), event.getEndTime().plusMinutes(1));
        if (domainService.hasTimeConflict(event, existing)) {
            throw new IllegalArgumentException("该时段已有其他日程，请调整时间");
        }
        return eventRepository.save(event);
    }

    @Transactional
    public Event update(Long id, Event data) {
        Event existing = getById(id);
        existing.update(data);
        if (!existing.isValid()) {
            throw new IllegalArgumentException("更新后日程数据不合法");
        }
        return eventRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        getById(id);
        eventRepository.delete(id);
    }
}
