package com.dailyschedule.infrastructure.persistence.repository;

import com.dailyschedule.domain.event.Event;
import com.dailyschedule.domain.event.EventRepository;
import com.dailyschedule.infrastructure.persistence.mapper.EventMapper;
import com.dailyschedule.infrastructure.persistence.mapper.EventTagMapper;
import com.dailyschedule.infrastructure.persistence.po.EventPO;
import com.dailyschedule.infrastructure.persistence.po.EventTagPO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class EventRepositoryImpl implements EventRepository {

    private final EventMapper eventMapper;
    private final EventTagMapper eventTagMapper;

    public EventRepositoryImpl(EventMapper eventMapper, EventTagMapper eventTagMapper) {
        this.eventMapper = eventMapper;
        this.eventTagMapper = eventTagMapper;
    }

    @Override
    public List<Event> findByRange(LocalDateTime start, LocalDateTime end) {
        List<EventPO> pos = eventMapper.selectByRange(start, end);
        return pos.stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<Event> findByRangeAndCategory(LocalDateTime start, LocalDateTime end, Long categoryId) {
        List<EventPO> pos = eventMapper.selectByRangeAndCategory(start, end, categoryId);
        return pos.stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public Optional<Event> findById(Long id) {
        EventPO po = eventMapper.selectById(id);
        if (po == null) return Optional.empty();
        Event event = toDomain(po);
        event.setTagIds(eventTagMapper.selectTagIdsByEventId(id).stream().collect(Collectors.toSet()));
        return Optional.of(event);
    }

    @Override
    @Transactional
    public Event save(Event event) {
        EventPO po = toPO(event);
        if (event.getId() == null) {
            eventMapper.insert(po);
            event.setId(po.getId());
            event.setCreatedAt(po.getCreatedAt());
            event.setUpdatedAt(po.getUpdatedAt());
        } else {
            eventMapper.updateById(po);
        }
        saveTags(event.getId(), event.getTagIds());
        return event;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        eventTagMapper.deleteByEventId(id);
        eventMapper.deleteById(id);
    }

    @Override
    public List<Event> findUpcoming(LocalDateTime now, LocalDateTime threshold) {
        return eventMapper.selectUpcoming(now, threshold).stream()
            .map(this::toDomain).collect(Collectors.toList());
    }

    private void saveTags(Long eventId, java.util.Set<Long> tagIds) {
        eventTagMapper.deleteByEventId(eventId);
        if (tagIds != null && !tagIds.isEmpty()) {
            for (Long tagId : tagIds) {
                eventTagMapper.insert(new EventTagPO(eventId, tagId));
            }
        }
    }

    private Event toDomain(EventPO po) {
        Event e = new Event();
        e.setId(po.getId());
        e.setTitle(po.getTitle());
        e.setDescription(po.getDescription());
        e.setStartTime(po.getStartTime());
        e.setEndTime(po.getEndTime());
        e.setAllDay(po.getAllDay() != null && po.getAllDay() == 1);
        e.setLocation(po.getLocation());
        e.setColor(po.getColor());
        e.setReminderMinutes(po.getReminderMinutes());
        e.setCategoryId(po.getCategoryId());
        e.setCreatedAt(po.getCreatedAt());
        e.setUpdatedAt(po.getUpdatedAt());
        return e;
    }

    private EventPO toPO(Event event) {
        EventPO po = new EventPO();
        po.setId(event.getId());
        po.setTitle(event.getTitle());
        po.setDescription(event.getDescription());
        po.setStartTime(event.getStartTime());
        po.setEndTime(event.getEndTime());
        po.setAllDay(event.getAllDay() != null && event.getAllDay() ? 1 : 0);
        po.setLocation(event.getLocation());
        po.setColor(event.getColor());
        po.setReminderMinutes(event.getReminderMinutes());
        po.setCategoryId(event.getCategoryId());
        return po;
    }
}
