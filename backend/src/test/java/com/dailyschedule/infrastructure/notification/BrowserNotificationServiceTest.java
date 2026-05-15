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

    @Test
    @DisplayName("supports：仅匹配 BROWSER 通道类型")
    void supports_onlyBrowser() {
        assertThat(service.supports(NotificationType.BROWSER)).isTrue();
        assertThat(service.supports(NotificationType.EMAIL)).isFalse();
        assertThat(service.supports(NotificationType.SMS)).isFalse();
    }

    @Test
    @DisplayName("send：以 JSON 形式向 SseEmitterManager 广播")
    void send_publishesJsonPayload() {
        Event event = new Event("团队周会",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        event.setId(42L);
        event.setReminderMinutes(15);

        service.send(event);

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(sseEmitterManager).sendToAll(captor.capture());
        String payload = captor.getValue();
        assertThat(payload).contains("\"id\":42");
        assertThat(payload).contains("\"title\":\"团队周会\"");
        assertThat(payload).contains("\"reminderMinutes\":15");
    }

    @Test
    @DisplayName("send：标题包含特殊字符（双引号、反斜杠、换行）也能正确 JSON 转义")
    void send_handlesSpecialCharactersInTitle() {
        Event event = new Event("title with \"quotes\" and \\ slash\nand newline",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        event.setId(1L);
        event.setReminderMinutes(10);

        service.send(event);

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(sseEmitterManager).sendToAll(captor.capture());
        String payload = captor.getValue();
        // 应该能成功解析回 JSON 对象（无引号 / 反斜杠破坏）
        assertThat(payload).startsWith("{").endsWith("}");
        // ObjectMapper 应已正确转义双引号为 \"
        assertThat(payload).contains("\\\"quotes\\\"");
    }

    @Test
    @DisplayName("send：reminderMinutes 为 null 时仍能序列化（写入 null）")
    void send_nullReminderMinutes_stillSerializes() {
        Event event = new Event("无提醒",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        event.setId(1L);
        // reminderMinutes 保持 null

        service.send(event);

        verify(sseEmitterManager).sendToAll(org.mockito.ArgumentMatchers.contains("\"reminderMinutes\":null"));
    }

    @Test
    @DisplayName("send：序列化失败 → 不调用 sendToAll")
    void send_serializationFailure_skipsBroadcast() throws Exception {
        ObjectMapper failing = new ObjectMapper() {
            @Override
            public String writeValueAsString(Object value)
                    throws com.fasterxml.jackson.core.JsonProcessingException {
                throw new com.fasterxml.jackson.core.JsonProcessingException("boom") {};
            }
        };
        BrowserNotificationService brittle = new BrowserNotificationService(sseEmitterManager, failing);
        Event event = new Event("x",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        event.setId(1L);

        brittle.send(event);

        verify(sseEmitterManager, never()).sendToAll(org.mockito.ArgumentMatchers.any());
    }
}
