package com.dailyschedule.api.controller;

import com.dailyschedule.api.assembler.EventAssembler;
import com.dailyschedule.api.generated.api.EventsApi;
import com.dailyschedule.api.generated.dto.EventCreateRequest;
import com.dailyschedule.api.generated.dto.EventResponse;
import com.dailyschedule.api.generated.dto.EventUpdateRequest;
import com.dailyschedule.application.event.EventApplicationService;
import com.dailyschedule.application.event.EventApplicationService.PagedEvents;
import com.dailyschedule.domain.event.Event;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1")
public class EventController implements EventsApi {

    private final EventApplicationService eventAppService;
    private final CurrentUserService currentUserService;

    public EventController(EventApplicationService eventAppService, CurrentUserService currentUserService) {
        this.eventAppService = eventAppService;
        this.currentUserService = currentUserService;
    }

    @Override
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse createEvent(@Valid @RequestBody EventCreateRequest request) {
        Event event = EventAssembler.toDomain(request);
        event.setUserId(currentUserService.getCurrentUserId());
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
    public EventResponse updateEvent(Long id, @Valid @RequestBody EventUpdateRequest request) {
        Event data = EventAssembler.toDomain(request);
        Event updated = eventAppService.update(id, data);
        return EventAssembler.toResponse(updated);
    }
}
