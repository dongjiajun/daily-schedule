package com.dailyschedule.infrastructure.scheduled;

import com.dailyschedule.domain.event.Event;
import com.dailyschedule.domain.event.EventRepository;
import com.dailyschedule.domain.notification.NotificationChannel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class ReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);

    private final EventRepository eventRepository;
    private final List<NotificationChannel> channels;

    public ReminderScheduler(EventRepository eventRepository, List<NotificationChannel> channels) {
        this.eventRepository = eventRepository;
        this.channels = channels;
    }

    @Scheduled(fixedRate = 60_000)
    public void checkReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<Event> upcoming = eventRepository.findUpcoming(now, now.plusHours(1));

        for (Event event : upcoming) {
            if (event.getReminderMinutes() == null) continue;

            LocalDateTime remindAt = event.getStartTime().minusMinutes(event.getReminderMinutes());

            if (remindAt.isAfter(now.minusMinutes(1)) && remindAt.isBefore(now.plusMinutes(1))) {
                log.info("发送提醒: {}", event.getTitle());
                for (NotificationChannel channel : channels) {
                    try {
                        channel.send(event);
                    } catch (Exception e) {
                        log.error("提醒发送失败: {}", e.getMessage());
                    }
                }
            }
        }
    }
}
