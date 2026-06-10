package com.dailyschedule.domain.event;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class EventDomainService {

    public boolean hasTimeConflict(Event newEvent, List<Event> existingEvents) {
        return existingEvents.stream()
            .filter(e -> !e.getId().equals(newEvent.getId()))
            .filter(Event::isActive)
            .anyMatch(e -> newEvent.isOverlapping(e));
    }
}
