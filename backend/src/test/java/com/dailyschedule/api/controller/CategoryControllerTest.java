package com.dailyschedule.api.controller;

import com.dailyschedule.application.category.CategoryApplicationService;
import com.dailyschedule.domain.category.Category;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CategoryController.class)
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CategoryApplicationService categoryAppService;

    @Test
    @DisplayName("GET /api/v1/categories → 返回分类列表")
    void listCategories_shouldReturn200() throws Exception {
        when(categoryAppService.listAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("POST /api/v1/categories → 创建成功返回 201")
    void createCategory_shouldReturn201() throws Exception {
        Category saved = new Category();
        saved.setId(1L);
        saved.setName("工作");
        saved.setColor("#1890ff");
        when(categoryAppService.create(any())).thenReturn(saved);

        mockMvc.perform(post("/api/v1/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"工作\",\"color\":\"#1890ff\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("工作"));
    }

    @Test
    @DisplayName("PUT /api/v1/categories/{id} → 更新不存在返回 404")
    void updateCategory_notFound_shouldReturn404() throws Exception {
        when(categoryAppService.update(any(), any()))
            .thenThrow(new RuntimeException("分类不存在: 999"));

        mockMvc.perform(put("/api/v1/categories/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"updated\"}"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/v1/categories/{id} → 删除成功返回 204")
    void deleteCategory_shouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/v1/categories/1"))
            .andExpect(status().isNoContent());
    }
}
