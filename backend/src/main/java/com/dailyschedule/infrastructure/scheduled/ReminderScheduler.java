package com.dailyschedule.infrastructure.scheduled;

import com.dailyschedule.domain.event.Event;
import com.dailyschedule.domain.event.EventRepository;
import com.dailyschedule.domain.notification.NotificationChannel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 每分钟扫描"未来 1 小时内、设有 reminderMinutes 的事件"，在到达提醒时刻 ± 30 秒窗口
 * 内通过所有 {@link NotificationChannel} 通道分发。
 *
 * <p>幂等：每个事件在 {@code last_reminded_at >= 计划提醒时间} 时跳过；分发成功后立刻
 * 写回 {@code last_reminded_at = now}，避免调度器抖动或多实例重复推送。</p>
 */
@Component
public class ReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);
    static final int WINDOW_SECONDS = 30;

    private final EventRepository eventRepository;
    private final List<NotificationChannel> channels;
    private final Clock clock;

    public ReminderScheduler(EventRepository eventRepository,
                             List<NotificationChannel> channels,
                             Clock clock) {
        this.eventRepository = eventRepository;
        this.channels = channels;
        this.clock = clock;
    }

    @Scheduled(fixedDelay = 30_000)
    public void checkReminders() {
        LocalDateTime now = LocalDateTime.now(clock);
        List<Event> upcoming = eventRepository.findUpcoming(now, now.plusHours(1));

        for (Event event : upcoming) {
            if (event.getReminderMinutes() == null) continue;

            LocalDateTime remindAt = event.getStartTime().minusMinutes(event.getReminderMinutes());
            if (!withinWindow(remindAt, now)) continue;
            if (alreadyReminded(event, remindAt)) continue;

            dispatch(event);
            eventRepository.markReminded(event.getId(), now);
        }
    }

    private boolean withinWindow(LocalDateTime remindAt, LocalDateTime now) {
        return remindAt.isAfter(now.minusSeconds(WINDOW_SECONDS))
            && remindAt.isBefore(now.plusSeconds(WINDOW_SECONDS));
    }

    private boolean alreadyReminded(Event event, LocalDateTime remindAt) {
        LocalDateTime last = event.getLastRemindedAt();
        return last != null && !last.isBefore(remindAt);
    }

    private void dispatch(Event event) {
        log.info("发送提醒: id={} title={}", event.getId(), event.getTitle());
        for (NotificationChannel channel : channels) {
            try {
                channel.send(event);
            } catch (Exception e) {
                log.error("提醒发送失败 id={}: {}", event.getId(), e.getMessage(), e);
            }
        }
    }
}
