package com.dailyschedule.infrastructure.notification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.lang.reflect.Field;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SseEmitterManagerTest {

    private SseEmitterManager manager;

    @BeforeEach
    void setUp() {
        manager = new SseEmitterManager();
    }

    @Test
    @DisplayName("register：成功返回 SseEmitter 且计数 +1")
    void register_increasesActiveCount() {
        SseEmitter emitter = manager.register();

        assertThat(emitter).isNotNull();
        assertThat(manager.getActiveCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("register：多次注册各自独立")
    void register_multiple_emitters() {
        manager.register();
        manager.register();
        manager.register();
        assertThat(manager.getActiveCount()).isEqualTo(3);
    }

    @Test
    @DisplayName("sendToAll：调用每个 emitter.send(builder)")
    void sendToAll_invokesEverySend() throws Exception {
        SseEmitter a = mock(SseEmitter.class);
        SseEmitter b = mock(SseEmitter.class);
        injectEmitters(manager, List.of(a, b));

        manager.sendToAll("{\"id\":1}");

        verify(a).send(org.mockito.ArgumentMatchers.any(SseEmitter.SseEventBuilder.class));
        verify(b).send(org.mockito.ArgumentMatchers.any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("sendToAll：IOException 的连接被移除，其他不受影响")
    void sendToAll_failedEmitter_isRemoved() throws Exception {
        SseEmitter ok = mock(SseEmitter.class);
        SseEmitter bad = mock(SseEmitter.class);
        doThrow(new IOException("boom")).when(bad).send(org.mockito.ArgumentMatchers.any(SseEmitter.SseEventBuilder.class));
        injectEmitters(manager, List.of(ok, bad));
        assertThat(manager.getActiveCount()).isEqualTo(2);

        manager.sendToAll("payload");

        verify(ok).send(org.mockito.ArgumentMatchers.any(SseEmitter.SseEventBuilder.class));
        assertThat(manager.getActiveCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("sendToAll：无连接时静默不抛")
    void sendToAll_noEmitters_doesNotThrow() {
        manager.sendToAll("payload");
        assertThat(manager.getActiveCount()).isZero();
    }

    @SuppressWarnings("unchecked")
    private static void injectEmitters(SseEmitterManager manager, List<SseEmitter> emitters) {
        try {
            Field f = SseEmitterManager.class.getDeclaredField("emitters");
            f.setAccessible(true);
            List<SseEmitter> list = (List<SseEmitter>) f.get(manager);
            list.addAll(emitters);
            // 模拟真实连接生命周期需要的 onCompletion/onTimeout/onError 回调由 register() 注册；
            // 直接注入的 mock 不携带这些回调，因此测试中我们只观察 sendToAll 行为。
        } catch (ReflectiveOperationException ex) {
            throw new RuntimeException(ex);
        }
    }
}
