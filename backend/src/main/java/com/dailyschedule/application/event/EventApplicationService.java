package com.dailyschedule.application.event;

import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.application.pet.PetApplicationService;
import com.dailyschedule.domain.event.Event;
import com.dailyschedule.domain.event.EventDomainService;
import com.dailyschedule.domain.event.EventFilter;
import com.dailyschedule.domain.event.EventRepository;
import com.dailyschedule.domain.event.EventStatus;
import com.dailyschedule.domain.pet.RewardSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventApplicationService {

    private final EventRepository eventRepository;
    private final EventDomainService domainService;
    private final PetApplicationService petApplicationService;

    public EventApplicationService(EventRepository eventRepository, EventDomainService domainService,
                                   PetApplicationService petApplicationService) {
        this.eventRepository = eventRepository;
        this.domainService = domainService;
        this.petApplicationService = petApplicationService;
    }

    public PagedEvents listByRange(LocalDateTime start, LocalDateTime end, Long userId,
                                   EventFilter filter, int page, int size) {
        List<Event> events = eventRepository.findByRange(start, end, userId, filter, page, size);
        long total = eventRepository.countByRange(start, end, userId, filter);
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
            event.getUserId(), EventFilter.NONE, 1, 1000);
        if (domainService.hasTimeConflict(event, existing)) {
            throw new IllegalArgumentException("该时段已有其他日程，请调整时间");
        }
        return eventRepository.save(event);
    }

    @Transactional
    public Event update(Long id, Event data, Long userId) {
        Event existing = getById(id, userId);
        EventStatus previousStatus = existing.getStatus();
        existing.update(data);
        if (!existing.isValid()) {
            throw new IllegalArgumentException("更新后日程数据不合法");
        }
        Event saved = eventRepository.save(existing);

        // 状态迁移挂钩：非 COMPLETED → COMPLETED 发放宠物奖励（幂等，同事务）
        if (saved.getStatus() == EventStatus.COMPLETED && previousStatus != EventStatus.COMPLETED) {
            petApplicationService.grantReward(RewardSource.EVENT_COMPLETED, String.valueOf(id));
        }
        return saved;
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Event existing = getById(id, userId);
        eventRepository.delete(id);

        // 取消负面奖励：删除未完成的日程 → 心情 -10（按 eventId 幂等一次）
        if (existing.getStatus() != EventStatus.COMPLETED) {
            petApplicationService.grantReward(RewardSource.EVENT_CANCELLED, String.valueOf(id));
        }
    }

    public record PagedEvents(List<Event> events, long total, int page, int size) {}
}
