package com.dailyschedule.api.controller;

import com.dailyschedule.api.assembler.EventAssembler;
import com.dailyschedule.api.generated.api.EventsApi;
import com.dailyschedule.api.generated.dto.EventCreateRequest;
import com.dailyschedule.api.generated.dto.EventResponse;
import com.dailyschedule.api.generated.dto.EventUpdateRequest;
import com.dailyschedule.application.event.EventApplicationService;
import com.dailyschedule.domain.event.Event;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class EventController implements EventsApi {

    private final EventApplicationService eventAppService;

    public EventController(EventApplicationService eventAppService) {
        this.eventAppService = eventAppService;
    }

    @Override
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse createEvent(EventCreateRequest request) {
        Event event = EventAssembler.toDomain(request);
        Event saved = eventAppService.create(event);
        return EventAssembler.toResponse(saved);
    }

    @Override
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(Long id) {
        eventAppService.delete(id);
    }

    @Override
    public EventResponse getEventById(Long id) {
        Event event = eventAppService.getById(id);
        return EventAssembler.toResponse(event);
    }

    @Override
    public List<EventResponse> listEvents(LocalDateTime start, LocalDateTime end, Long categoryId) {
        List<Event> events = eventAppService.listByRange(start, end, categoryId);
        return EventAssembler.toResponseList(events);
    }

    @Override
    public EventResponse updateEvent(Long id, EventUpdateRequest request) {
        Event data = EventAssembler.toDomain(request);
        Event updated = eventAppService.update(id, data);
        return EventAssembler.toResponse(updated);
    }
}
