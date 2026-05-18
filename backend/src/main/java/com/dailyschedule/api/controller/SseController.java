package com.dailyschedule.api.controller;

import com.dailyschedule.infrastructure.notification.SseEmitterManager;
import com.dailyschedule.infrastructure.security.JwtUtil;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
public class SseController {

    private final SseEmitterManager sseEmitterManager;
    private final JwtUtil jwtUtil;

    public SseController(SseEmitterManager sseEmitterManager, JwtUtil jwtUtil) {
        this.sseEmitterManager = sseEmitterManager;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/api/v1/sse/notifications")
    public SseEmitter subscribe(@RequestParam("token") String token) {
        if (!jwtUtil.validateToken(token)) {
            throw new IllegalArgumentException("无效的认证令牌");
        }
        return sseEmitterManager.register();
    }
}
