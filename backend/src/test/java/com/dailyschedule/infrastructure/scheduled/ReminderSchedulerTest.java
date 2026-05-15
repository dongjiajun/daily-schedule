package com.dailyschedule.infrastructure.scheduled;

import com.dailyschedule.domain.event.Event;
import com.dailyschedule.domain.event.EventRepository;
import com.dailyschedule.domain.notification.NotificationChannel;
import com.dailyschedule.domain.notification.NotificationType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReminderSchedulerTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private NotificationChannel channelA;

    @Mock
    private NotificationChannel channelB;

    private ReminderScheduler scheduler;
    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 5, 10, 9, 0, 0);

    @BeforeEach
    void setUp() {
        Clock fixed = Clock.fixed(NOW.toInstant(ZoneOffset.ofHours(8)), ZONE);
        scheduler = new ReminderScheduler(eventRepository, List.of(channelA, channelB), fixed);
    }

    @Test
    @DisplayName("到达提醒时刻 → 向所有通道分发并标记为已提醒")
    void checkReminders_atReminderTime_dispatchesAndMarks() {
        Event event = buildEvent(1L, NOW.plusMinutes(15), 15, null);
        when(eventRepository.findUpcoming(any(), any())).thenReturn(List.of(event));

        scheduler.checkReminders();

        verify(channelA).send(event);
        verify(channelB).send(event);
        verify(eventRepository).markReminded(eq(1L), eq(NOW));
    }

    @Test
    @DisplayName("窗口外（未到时间）→ 不发送")
    void checkReminders_beforeReminderWindow_skips() {
        Event event = buildEvent(1L, NOW.plusMinutes(30), 15, null);
        when(eventRepository.findUpcoming(any(), any())).thenReturn(List.of(event));

        scheduler.checkReminders();

        verify(channelA, never()).send(any());
        verify(eventRepository, never()).markReminded(any(), any());
    }

    @Test
    @DisplayName("已标记 last_reminded_at >= 计划提醒时刻 → 幂等跳过")
    void checkReminders_alreadyReminded_skips() {
        // remindAt = start - 15min = NOW；lastRemindedAt = NOW + 1s 表示已发过
        Event event = buildEvent(1L, NOW.plusMinutes(15), 15, NOW.plusSeconds(1));
        when(eventRepository.findUpcoming(any(), any())).thenReturn(List.of(event));

        scheduler.checkReminders();

        verify(channelA, never()).send(any());
        verify(eventRepository, never()).markReminded(any(), any());
    }

    @Test
    @DisplayName("reminderMinutes 为 null → 跳过")
    void checkReminders_noReminderMinutes_skips() {
        Event event = buildEvent(1L, NOW.plusMinutes(15), null, null);
        when(eventRepository.findUpcoming(any(), any())).thenReturn(List.of(event));

        scheduler.checkReminders();

        verify(channelA, never()).send(any());
    }

    @Test
    @DisplayName("单通道异常 → 不影响其他通道，仍标记为已提醒")
    void checkReminders_oneChannelFails_othersStillFire() {
        Event event = buildEvent(1L, NOW.plusMinutes(15), 15, null);
        when(eventRepository.findUpcoming(any(), any())).thenReturn(List.of(event));
        org.mockito.Mockito.doThrow(new RuntimeException("network")).when(channelA).send(any());

        scheduler.checkReminders();

        verify(channelA).send(event);
        verify(channelB).send(event);
        verify(eventRepository).markReminded(eq(1L), eq(NOW));
    }

    @Test
    @DisplayName("多事件 → 各自独立判断")
    void checkReminders_multipleEvents_handledIndependently() {
        Event in = buildEvent(1L, NOW.plusMinutes(15), 15, null);              // 在窗口
        Event out = buildEvent(2L, NOW.plusMinutes(30), 15, null);             // 不在窗口
        Event done = buildEvent(3L, NOW.plusMinutes(15), 15, NOW.plusSeconds(1)); // 已发
        when(eventRepository.findUpcoming(any(), any())).thenReturn(List.of(in, out, done));

        scheduler.checkReminders();

        verify(channelA, times(1)).send(in);
        verify(channelA, never()).send(out);
        verify(channelA, never()).send(done);
        verify(eventRepository).markReminded(eq(1L), any());
        verify(eventRepository, never()).markReminded(eq(2L), any());
        verify(eventRepository, never()).markReminded(eq(3L), any());
    }

    @Test
    @DisplayName("supports() 由具体通道决定，与调度器无关 — sanity check")
    void notificationChannelSupports_isOrthogonal() {
        when(channelA.supports(NotificationType.BROWSER)).thenReturn(true);
        org.assertj.core.api.Assertions
            .assertThat(channelA.supports(NotificationType.BROWSER))
            .isTrue();
    }

    private static Event buildEvent(Long id, LocalDateTime startAt,
                                    Integer reminderMinutes, LocalDateTime lastRemindedAt) {
        Event e = new Event("Test " + id, startAt, startAt.plusHours(1));
        e.setId(id);
        e.setReminderMinutes(reminderMinutes);
        e.setLastRemindedAt(lastRemindedAt);
        return e;
    }
}
