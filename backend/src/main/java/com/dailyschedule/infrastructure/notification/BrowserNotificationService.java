package com.dailyschedule.infrastructure.notification;

import com.dailyschedule.domain.event.Event;
import com.dailyschedule.domain.notification.NotificationChannel;
import com.dailyschedule.domain.notification.NotificationType;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class BrowserNotificationService implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(BrowserNotificationService.class);

    private final SseEmitterManager sseEmitterManager;
    private final ObjectMapper objectMapper;

    public BrowserNotificationService(SseEmitterManager sseEmitterManager,
                                      ObjectMapper objectMapper) {
        this.sseEmitterManager = sseEmitterManager;
        this.objectMapper = objectMapper;
    }

    @Override
    public void send(Event event) {
        String payload = serialize(event);
        if (payload == null) return;
        log.info("浏览器通知: 日程「{}」即将在 {} 开始", event.getTitle(), event.getStartTime());
        sseEmitterManager.sendToUser(event.getUserId(), payload);
    }

    @Override
    public boolean supports(NotificationType type) {
        return type == NotificationType.BROWSER;
    }

    private String serialize(Event event) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", event.getId());
        payload.put("title", event.getTitle());
        payload.put("startTime", event.getStartTime());
        payload.put("reminderMinutes", event.getReminderMinutes());
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            log.error("提醒载荷序列化失败 id={}: {}", event.getId(), e.getMessage(), e);
            return null;
        }
    }
}
