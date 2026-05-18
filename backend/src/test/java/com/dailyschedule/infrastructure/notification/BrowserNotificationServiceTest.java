package com.dailyschedule.infrastructure.notification;

import com.dailyschedule.domain.event.Event;
import com.dailyschedule.domain.notification.NotificationType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class BrowserNotificationServiceTest {

    @Mock
    private SseEmitterManager sseEmitterManager;

    private BrowserNotificationService service;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        service = new BrowserNotificationService(sseEmitterManager, objectMapper);
    }

    private static Event createEvent(String title, LocalDateTime start, LocalDateTime end) {
        Event event = new Event(title, start, end);
        event.setUserId(1L);
        return event;
    }

    @Test
    @DisplayName("supports：仅匹配 BROWSER 通道类型")
    void supports_onlyBrowser() {
        assertThat(service.supports(NotificationType.BROWSER)).isTrue();
        assertThat(service.supports(NotificationType.EMAIL)).isFalse();
        assertThat(service.supports(NotificationType.SMS)).isFalse();
    }

    @Test
    @DisplayName("send：以 JSON 形式向对应用户推送")
    void send_publishesJsonPayload() {
        Event event = createEvent("团队周会",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        event.setId(42L);
        event.setReminderMinutes(15);

        service.send(event);

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(sseEmitterManager).sendToUser(eq(1L), captor.capture());
        String payload = captor.getValue();
        assertThat(payload).contains("\"id\":42");
        assertThat(payload).contains("\"title\":\"团队周会\"");
        assertThat(payload).contains("\"reminderMinutes\":15");
    }

    @Test
    @DisplayName("send：标题包含特殊字符（双引号、反斜杠、换行）也能正确 JSON 转义")
    void send_handlesSpecialCharactersInTitle() {
        Event event = createEvent("title with \"quotes\" and \\ slash\nand newline",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        event.setId(1L);
        event.setReminderMinutes(10);

        service.send(event);

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(sseEmitterManager).sendToUser(eq(1L), captor.capture());
        String payload = captor.getValue();
        assertThat(payload).startsWith("{").endsWith("}");
        assertThat(payload).contains("\\\"quotes\\\"");
    }

    @Test
    @DisplayName("send：reminderMinutes 为 null 时仍能序列化（写入 null）")
    void send_nullReminderMinutes_stillSerializes() {
        Event event = createEvent("无提醒",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        event.setId(1L);

        service.send(event);

        verify(sseEmitterManager).sendToUser(eq(1L), contains("\"reminderMinutes\":null"));
    }

    @Test
    @DisplayName("send：序列化失败 → 不调用 sendToUser")
    void send_serializationFailure_skipsBroadcast() throws Exception {
        ObjectMapper failing = new ObjectMapper() {
            @Override
            public String writeValueAsString(Object value)
                    throws com.fasterxml.jackson.core.JsonProcessingException {
                throw new com.fasterxml.jackson.core.JsonProcessingException("boom") {};
            }
        };
        BrowserNotificationService brittle = new BrowserNotificationService(sseEmitterManager, failing);
        Event event = createEvent("x",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        event.setId(1L);

        brittle.send(event);

        verify(sseEmitterManager, never()).sendToUser(anyLong(), any());
    }
}
