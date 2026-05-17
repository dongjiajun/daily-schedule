package com.dailyschedule.infrastructure.persistence.repository;

import com.dailyschedule.domain.event.Event;
import com.dailyschedule.domain.event.EventRepository;
import com.dailyschedule.domain.tag.Tag;
import com.dailyschedule.infrastructure.persistence.mapper.EventMapper;
import com.dailyschedule.infrastructure.persistence.mapper.EventTagMapper;
import com.dailyschedule.infrastructure.persistence.mapper.EventTagMapper.EventTagJoinRow;
import com.dailyschedule.infrastructure.persistence.mapper.TagMapper;
import com.dailyschedule.infrastructure.persistence.po.EventPO;
import com.dailyschedule.infrastructure.persistence.po.EventTagPO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Repository
public class EventRepositoryImpl implements EventRepository {

    private final EventMapper eventMapper;
    private final EventTagMapper eventTagMapper;
    private final TagMapper tagMapper;

    public EventRepositoryImpl(EventMapper eventMapper, EventTagMapper eventTagMapper, TagMapper tagMapper) {
        this.eventMapper = eventMapper;
        this.eventTagMapper = eventTagMapper;
        this.tagMapper = tagMapper;
    }

    @Override
    public List<Event> findByRange(LocalDateTime start, LocalDateTime end, Long userId, String keyword, int page, int size) {
        int offset = (page - 1) * size;
        return loadWithTags(eventMapper.selectByRange(start, end, userId, keyword, offset, size));
    }

    @Override
    public List<Event> findByRangeAndCategory(LocalDateTime start, LocalDateTime end, Long categoryId, Long userId, String keyword, int page, int size) {
        int offset = (page - 1) * size;
        return loadWithTags(eventMapper.selectByRangeAndCategory(start, end, categoryId, userId, keyword, offset, size));
    }

    @Override
    public long countByRange(LocalDateTime start, LocalDateTime end, Long userId, String keyword) {
        return eventMapper.countByRange(start, end, userId, keyword);
    }

    @Override
    public long countByRangeAndCategory(LocalDateTime start, LocalDateTime end, Long categoryId, Long userId, String keyword) {
        return eventMapper.countByRangeAndCategory(start, end, categoryId, userId, keyword);
    }

    @Override
    public Optional<Event> findById(Long id) {
        EventPO po = eventMapper.selectById(id);
        if (po == null) return Optional.empty();
        return Optional.of(loadWithTags(List.of(po)).get(0));
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
        return loadWithTags(eventMapper.selectUpcoming(now, threshold));
    }

    @Override
    public void markReminded(Long id, LocalDateTime remindedAt) {
        eventMapper.updateLastRemindedAt(id, remindedAt);
    }

    private void saveTags(Long eventId, Set<Long> tagIds) {
        eventTagMapper.deleteByEventId(eventId);
        if (tagIds != null && !tagIds.isEmpty()) {
            List<EventTagPO> mappings = tagIds.stream()
                .map(tagId -> new EventTagPO(eventId, tagId))
                .collect(Collectors.toList());
            eventTagMapper.batchInsert(mappings);
        }
    }

    private List<Event> loadWithTags(List<EventPO> pos) {
        if (pos == null || pos.isEmpty()) return List.of();
        List<Event> events = pos.stream().map(this::toDomain).collect(Collectors.toList());
        Map<Long, Event> byId = events.stream()
            .collect(Collectors.toMap(Event::getId, e -> e));

        List<EventTagJoinRow> rows = eventTagMapper.selectTagsByEventIds(byId.keySet());
        Map<Long, List<Tag>> tagsByEvent = new HashMap<>();
        Map<Long, Set<Long>> tagIdsByEvent = new HashMap<>();
        for (EventTagJoinRow row : rows) {
            Tag tag = new Tag();
            tag.setId(row.getId());
            tag.setName(row.getName());
            tag.setColor(row.getColor());
            tag.setCreatedAt(row.getCreatedAt());
            tag.setUpdatedAt(row.getUpdatedAt());
            tagsByEvent.computeIfAbsent(row.getEventIdRef(), k -> new ArrayList<>()).add(tag);
            tagIdsByEvent.computeIfAbsent(row.getEventIdRef(), k -> new HashSet<>()).add(row.getId());
        }
        for (Event e : events) {
            e.setTags(tagsByEvent.getOrDefault(e.getId(), Collections.emptyList()));
            e.setTagIds(tagIdsByEvent.getOrDefault(e.getId(), Collections.emptySet()));
        }
        return events;
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
        e.setUserId(po.getUserId());
        e.setLastRemindedAt(po.getLastRemindedAt());
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
        po.setUserId(event.getUserId());
        po.setLastRemindedAt(event.getLastRemindedAt());
        return po;
    }
}
