package com.dailyschedule.api.controller;

import com.dailyschedule.infrastructure.notification.SseEmitterManager;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
public class SseController {

    private final SseEmitterManager sseEmitterManager;

    public SseController(SseEmitterManager sseEmitterManager) {
        this.sseEmitterManager = sseEmitterManager;
    }

    @GetMapping("/api/v1/sse/notifications")
    public SseEmitter subscribe() {
        return sseEmitterManager.register();
    }
}
