package com.dailyschedule.api.controller;

import com.dailyschedule.api.assembler.EventAssembler;
import com.dailyschedule.api.generated.api.EventsApi;
import com.dailyschedule.api.generated.dto.EventCreateRequest;
import com.dailyschedule.api.generated.dto.EventResponse;
import com.dailyschedule.api.generated.dto.EventStatus;
import com.dailyschedule.api.generated.dto.EventUpdateRequest;
import com.dailyschedule.application.event.EventApplicationService;
import com.dailyschedule.domain.event.Event;
import com.dailyschedule.domain.event.EventFilter;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class EventController implements EventsApi {

    private static final Logger log = LoggerFactory.getLogger(EventController.class);

    private final EventApplicationService eventAppService;
    private final CurrentUserService currentUserService;

    public EventController(EventApplicationService eventAppService, CurrentUserService currentUserService) {
        this.eventAppService = eventAppService;
        this.currentUserService = currentUserService;
    }

    @Override
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse createEvent(@Valid @RequestBody EventCreateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        log.info("createEvent: userId={} title={}", userId, request.getTitle());
        Event event = EventAssembler.toDomain(request);
        event.setUserId(userId);
        Event saved = eventAppService.create(event);
        return EventAssembler.toResponse(saved);
    }

    @Override
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(Long id) {
        Long userId = currentUserService.getCurrentUserId();
        log.info("deleteEvent: userId={} id={}", userId, id);
        eventAppService.delete(id, userId);
    }

    @Override
    public EventResponse getEventById(Long id) {
        Long userId = currentUserService.getCurrentUserId();
        log.info("getEventById: userId={} id={}", userId, id);
        Event event = eventAppService.getById(id, userId);
        return EventAssembler.toResponse(event);
    }

    @Override
    public List<EventResponse> listEvents(LocalDateTime start, LocalDateTime end, Long categoryId,
                                          Long tagId, EventStatus status,
                                          String keyword, Integer page, Integer size) {
        Long userId = currentUserService.getCurrentUserId();
        log.info("listEvents: userId={} start={} end={}", userId, start, end);
        int p = page != null && page > 0 ? page : 1;
        int s = size != null && size > 0 ? size : 50;
        EventFilter filter = new EventFilter(categoryId, tagId, EventAssembler.toDomainStatus(status), keyword);
        var result = eventAppService.listByRange(start, end, userId, filter, p, s);
        return EventAssembler.toResponseList(result.events());
    }

    @Override
    public EventResponse updateEvent(Long id, @Valid @RequestBody EventUpdateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        log.info("updateEvent: userId={} id={}", userId, id);
        Event data = EventAssembler.toDomain(request);
        Event updated = eventAppService.update(id, data, userId);
        return EventAssembler.toResponse(updated);
    }
}
