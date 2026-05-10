package com.dailyschedule.infrastructure.notification;

import com.dailyschedule.domain.event.Event;
import com.dailyschedule.domain.notification.NotificationChannel;
import com.dailyschedule.domain.notification.NotificationType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class BrowserNotificationService implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(BrowserNotificationService.class);

    private final SseEmitterManager sseEmitterManager;

    public BrowserNotificationService(SseEmitterManager sseEmitterManager) {
        this.sseEmitterManager = sseEmitterManager;
    }

    @Override
    public void send(Event event) {
        String payload = String.format("{\"id\":%d,\"title\":\"%s\",\"startTime\":\"%s\",\"reminderMinutes\":%d}",
            event.getId(), event.getTitle(), event.getStartTime(), event.getReminderMinutes());
        log.info("浏览器通知: 日程「{}」即将在 {} 开始", event.getTitle(), event.getStartTime());
        sseEmitterManager.sendToAll(payload);
    }

    @Override
    public boolean supports(NotificationType type) {
        return type == NotificationType.BROWSER;
    }
}
