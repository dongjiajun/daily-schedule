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

    @Override
    public void send(Event event) {
        log.info("浏览器通知: 日程「{}」即将在 {} 开始 (提前 {} 分钟)",
            event.getTitle(), event.getStartTime(), event.getReminderMinutes());
        // 实际浏览器推送通过 SSE/WebSocket 发送给前端
        // v1 版本通过日志记录，v2 升级为实时推送
    }

    @Override
    public boolean supports(NotificationType type) {
        return type == NotificationType.BROWSER;
    }
}
