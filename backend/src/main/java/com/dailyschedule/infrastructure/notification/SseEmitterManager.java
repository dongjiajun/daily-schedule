package com.dailyschedule.infrastructure.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class SseEmitterManager {

    private static final Logger log = LoggerFactory.getLogger(SseEmitterManager.class);

    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    SseEmitter createEmitter() {
        return new SseEmitter(0L);
    }

    public SseEmitter register(Long userId) {
        SseEmitter emitter = createEmitter();
        userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> remove(userId, emitter));
        emitter.onError(e -> remove(userId, emitter));
        try {
            emitter.send(SseEmitter.event()
                .name("connect")
                .data("connected"));
        } catch (IOException e) {
            remove(userId, emitter);
            log.warn("SSE 握手事件发送失败，已移除连接: {}", e.getMessage());
        }
        return emitter;
    }

    private void remove(Long userId, SseEmitter emitter) {
        List<SseEmitter> list = userEmitters.get(userId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }

    public void sendToUser(Long userId, String event) {
        List<SseEmitter> list = userEmitters.get(userId);
        if (list == null) return;
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event()
                    .name("reminder")
                    .data(event));
            } catch (IOException e) {
                remove(userId, emitter);
                log.warn("SSE 发送失败，已移除连接: {}", e.getMessage());
            }
        }
    }

    @Scheduled(fixedRateString = "${sse.heartbeat.intervalMs:30000}")
    public void sendHeartbeat() {
        for (Map.Entry<Long, CopyOnWriteArrayList<SseEmitter>> entry : userEmitters.entrySet()) {
            Long userId = entry.getKey();
            for (SseEmitter emitter : entry.getValue()) {
                try {
                    emitter.send(SseEmitter.event()
                        .name("heartbeat")
                        .data("ping"));
                } catch (IOException e) {
                    remove(userId, emitter);
                    log.debug("SSE 心跳发送失败，已移除连接: userId={}", userId);
                }
            }
        }
    }

    public int getActiveCount() {
        return userEmitters.values().stream().mapToInt(List::size).sum();
    }
}
