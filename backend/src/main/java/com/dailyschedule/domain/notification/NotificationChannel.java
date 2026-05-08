package com.dailyschedule.domain.notification;

import com.dailyschedule.domain.event.Event;

public interface NotificationChannel {
    void send(Event event);
    boolean supports(NotificationType type);
}
