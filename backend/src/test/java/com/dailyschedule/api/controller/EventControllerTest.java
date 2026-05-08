package com.dailyschedule.api.controller;

import com.dailyschedule.application.event.EventApplicationService;
import com.dailyschedule.domain.event.Event;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EventController.class)
class EventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EventApplicationService appService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("GET /api/v1/events → 参数合法返回 200")
    void listEvents_shouldReturn200() throws Exception {
        when(appService.listByRange(any(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/events")
                .param("start", "2026-05-01T00:00:00")
                .param("end", "2026-05-31T23:59:59"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("GET /api/v1/events → 缺少 start 参数返回 400")
    void listEvents_missingStart_shouldReturn400() throws Exception {
        mockMvc.perform(get("/api/v1/events")
                .param("end", "2026-05-31T23:59:59"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/events → 创建成功返回 201")
    void createEvent_shouldReturn201() throws Exception {
        Event saved = new Event();
        saved.setId(1L);
        saved.setTitle("Test");
        saved.setStartTime(LocalDateTime.of(2026, 5, 9, 10, 0));
        saved.setEndTime(LocalDateTime.of(2026, 5, 9, 11, 0));
        when(appService.create(any())).thenReturn(saved);

        String body = """
            {"title":"Test","startTime":"2026-05-09T10:00:00","endTime":"2026-05-09T11:00:00"}""";

        mockMvc.perform(post("/api/v1/events")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.title").value("Test"));
    }

    @Test
    @DisplayName("DELETE /api/v1/events/{id} → 删除成功返回 204")
    void deleteEvent_shouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/v1/events/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /api/v1/events/{id} → 不存在返回 404")
    void getEventById_notFound_shouldReturn404() throws Exception {
        when(appService.getById(999L))
            .thenThrow(new RuntimeException("日程不存在: 999"));

        mockMvc.perform(get("/api/v1/events/999"))
            .andExpect(status().isNotFound());
    }
}
