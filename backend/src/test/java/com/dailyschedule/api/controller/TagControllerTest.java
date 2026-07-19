package com.dailyschedule.api.controller;

import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.application.tag.TagApplicationService;
import com.dailyschedule.domain.tag.Tag;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class TagControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TagApplicationService tagAppService;

    @MockitoBean
    private CurrentUserService currentUserService;

    @Test
    @DisplayName("GET /api/v1/tags -> 返回标签列表")
    void listTags_shouldReturn200() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(tagAppService.listAll(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/tags"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("POST /api/v1/tags -> 创建成功返回 201")
    void createTag_shouldReturn201() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        Tag saved = new Tag();
        saved.setId(1L);
        saved.setName("重要");
        saved.setColor("#ff0000");
        when(tagAppService.create(any())).thenReturn(saved);

        mockMvc.perform(post("/api/v1/tags")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"重要\",\"color\":\"#ff0000\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("重要"));
    }

    @Test
    @DisplayName("PUT /api/v1/tags/{id} -> 更新不存在返回 404")
    void updateTag_notFound_shouldReturn404() throws Exception {
        when(tagAppService.update(any(), any(), any()))
            .thenThrow(new ResourceNotFoundException("标签不存在: 999"));

        mockMvc.perform(put("/api/v1/tags/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"updated\"}"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/v1/tags/{id} -> 删除成功返回 204")
    void deleteTag_shouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/v1/tags/1"))
            .andExpect(status().isNoContent());
    }
}
