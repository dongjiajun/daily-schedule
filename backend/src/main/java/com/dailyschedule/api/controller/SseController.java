package com.dailyschedule.api.controller;

import com.dailyschedule.infrastructure.notification.SseEmitterManager;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * SSE 通知通道。
 *
 * <p>鉴权：依赖 {@code dsa_sse_session} HttpOnly Cookie，由 {@code JwtAuthFilter}
 * 在请求进入时解析并注入 SecurityContext。本端点不再接受 {@code ?token=} 查询参数
 * （v3.0 安全收紧：避免 token 出现在 URL / 日志）。</p>
 */
@RestController
public class SseController {

    private final SseEmitterManager sseEmitterManager;
    private final CurrentUserService currentUserService;

    public SseController(SseEmitterManager sseEmitterManager,
                         CurrentUserService currentUserService) {
        this.sseEmitterManager = sseEmitterManager;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/api/v1/sse/notifications")
    public SseEmitter subscribe() {
        Long userId = currentUserService.getCurrentUserId();
        return sseEmitterManager.register(userId);
    }
}
