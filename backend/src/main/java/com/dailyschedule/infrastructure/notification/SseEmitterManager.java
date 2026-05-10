package com.dailyschedule.infrastructure.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class SseEmitterManager {

    private static final Logger log = LoggerFactory.getLogger(SseEmitterManager.class);

    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter register() {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        return emitter;
    }

    public void sendToAll(String event) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                    .name("reminder")
                    .data(event));
            } catch (IOException e) {
                emitters.remove(emitter);
                log.warn("SSE 发送失败，已移除连接: {}", e.getMessage());
            }
        }
    }

    public int getActiveCount() {
        return emitters.size();
    }
}
