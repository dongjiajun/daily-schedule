package com.dailyschedule.api.controller;

import com.dailyschedule.infrastructure.notification.SseEmitterManager;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class SseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SseEmitterManager sseEmitterManager;

    @MockitoBean
    private CurrentUserService currentUserService;

    @Test
    @DisplayName("GET /api/v1/sse/notifications -> 返回 SseEmitter")
    void subscribe_shouldReturn200() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(sseEmitterManager.register(1L)).thenReturn(new SseEmitter(0L));

        mockMvc.perform(get("/api/v1/sse/notifications"))
            .andExpect(status().isOk());
    }
}
