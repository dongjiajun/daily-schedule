package com.dailyschedule.api.assembler;

import com.dailyschedule.api.generated.dto.EventCreateRequest;
import com.dailyschedule.api.generated.dto.EventUpdateRequest;
import com.dailyschedule.api.generated.dto.EventResponse;
import com.dailyschedule.api.generated.dto.TagResponse;
import com.dailyschedule.domain.event.Event;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class EventAssembler {

    public static Event toDomain(EventCreateRequest dto) {
        Event e = new Event();
        e.setTitle(dto.getTitle());
        e.setDescription(dto.getDescription());
        e.setStartTime(dto.getStartTime());
        e.setEndTime(dto.getEndTime());
        e.setAllDay(dto.getAllDay());
        e.setLocation(dto.getLocation());
        e.setColor(dto.getColor());
        e.setReminderMinutes(dto.getReminderMinutes());
        e.setCategoryId(dto.getCategoryId());
        if (dto.getTagIds() != null) {
            e.setTagIds(Set.copyOf(dto.getTagIds()));
        }
        return e;
    }

    public static Event toDomain(EventUpdateRequest dto) {
        Event e = new Event();
        e.setTitle(dto.getTitle());
        e.setDescription(dto.getDescription());
        e.setStartTime(dto.getStartTime());
        e.setEndTime(dto.getEndTime());
        e.setAllDay(dto.getAllDay());
        e.setLocation(dto.getLocation());
        e.setColor(dto.getColor());
        e.setReminderMinutes(dto.getReminderMinutes());
        e.setCategoryId(dto.getCategoryId());
        if (dto.getTagIds() != null) {
            e.setTagIds(Set.copyOf(dto.getTagIds()));
        }
        return e;
    }

    public static EventResponse toResponse(Event event) {
        EventResponse resp = new EventResponse();
        resp.setId(event.getId());
        resp.setTitle(event.getTitle());
        resp.setDescription(event.getDescription());
        resp.setStartTime(event.getStartTime());
        resp.setEndTime(event.getEndTime());
        resp.setAllDay(event.getAllDay());
        resp.setLocation(event.getLocation());
        resp.setColor(event.getColor());
        resp.setReminderMinutes(event.getReminderMinutes());
        resp.setCategoryId(event.getCategoryId());
        resp.setCategoryName(event.getCategoryName());
        resp.setCategoryColor(event.getCategoryColor());
        resp.setCreatedAt(event.getCreatedAt());
        resp.setUpdatedAt(event.getUpdatedAt());
        if (event.getTagIds() != null && !event.getTagIds().isEmpty()) {
            resp.setTags(event.getTagIds().stream().map(id -> {
                TagResponse t = new TagResponse();
                t.setId(id);
                return t;
            }).collect(Collectors.toList()));
        }
        return resp;
    }

    public static List<EventResponse> toResponseList(List<Event> events) {
        return events.stream().map(EventAssembler::toResponse).collect(Collectors.toList());
    }
}
