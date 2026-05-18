package com.dailyschedule.infrastructure.notification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class SseEmitterManagerTest {

    private SseEmitterManager manager;

    @BeforeEach
    void setUp() {
        manager = new SseEmitterManager();
    }

    @Test
    @DisplayName("register：成功返回 SseEmitter 且计数 +1")
    void register_increasesActiveCount() {
        SseEmitter emitter = manager.register(1L);

        assertThat(emitter).isNotNull();
        assertThat(manager.getActiveCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("register：多次注册各自独立")
    void register_multiple_emitters() {
        manager.register(1L);
        manager.register(1L);
        manager.register(2L);
        assertThat(manager.getActiveCount()).isEqualTo(3);
    }

    @Test
    @DisplayName("sendToUser：只推送给指定用户，不影响其他用户")
    void sendToUser_invokesCorrectUserEmitters() throws Exception {
        SseEmitter a = mock(SseEmitter.class);
        SseEmitter b = mock(SseEmitter.class);
        injectEmitters(manager, 1L, List.of(a));
        injectEmitters(manager, 2L, List.of(b));

        manager.sendToUser(1L, "{\"id\":1}");

        verify(a).send(org.mockito.ArgumentMatchers.any(SseEmitter.SseEventBuilder.class));
        verify(b, org.mockito.Mockito.never()).send(org.mockito.ArgumentMatchers.any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("sendToUser：IOException 的连接被移除，其他不受影响")
    void sendToUser_failedEmitter_isRemoved() throws Exception {
        SseEmitter ok = mock(SseEmitter.class);
        SseEmitter bad = mock(SseEmitter.class);
        doThrow(new IOException("boom")).when(bad).send(org.mockito.ArgumentMatchers.any(SseEmitter.SseEventBuilder.class));
        injectEmitters(manager, 1L, List.of(ok, bad));
        assertThat(manager.getActiveCount()).isEqualTo(2);

        manager.sendToUser(1L, "payload");

        verify(ok).send(org.mockito.ArgumentMatchers.any(SseEmitter.SseEventBuilder.class));
        assertThat(manager.getActiveCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("sendToUser：目标用户无连接时静默不抛")
    void sendToUser_noEmitters_doesNotThrow() {
        manager.sendToUser(999L, "payload");
        assertThat(manager.getActiveCount()).isZero();
    }

    @SuppressWarnings("unchecked")
    private static void injectEmitters(SseEmitterManager manager, Long userId, List<SseEmitter> emitters) {
        try {
            Field f = SseEmitterManager.class.getDeclaredField("userEmitters");
            f.setAccessible(true);
            Map<Long, CopyOnWriteArrayList<SseEmitter>> map = (Map<Long, CopyOnWriteArrayList<SseEmitter>>) f.get(manager);
            map.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).addAll(emitters);
        } catch (ReflectiveOperationException ex) {
            throw new RuntimeException(ex);
        }
    }
}
