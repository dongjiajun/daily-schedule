package com.dailyschedule.api.controller;

import com.dailyschedule.application.todo.TodoApplicationService;
import com.dailyschedule.domain.task.Task;
import com.dailyschedule.domain.task.TaskPriority;
import com.dailyschedule.domain.task.TaskStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class TodoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TodoApplicationService todoAppService;

    private Task sampleTask(Long id, String title, TaskStatus status) {
        return sampleTask(id, title, status, TaskPriority.MEDIUM);
    }

    private Task sampleTask(Long id, String title, TaskStatus status, TaskPriority priority) {
        Task task = new Task();
        task.setId(id);
        task.setUserId(1L);
        task.setTitle(title);
        task.setStatus(status);
        task.setPriority(priority);
        task.setSortOrder(1);
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        return task;
    }

    @Test
    @DisplayName("GET /api/v1/tasks → 返回任务列表")
    void listTasks_shouldReturn200() throws Exception {
        when(todoAppService.listTasks(isNull(), isNull(), isNull()))
            .thenReturn(List.of(sampleTask(1L, "任务A", TaskStatus.TODO)));

        mockMvc.perform(get("/api/v1/tasks"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].title").value("任务A"))
            .andExpect(jsonPath("$[0].status").value("TODO"));
    }

    @Test
    @DisplayName("GET /api/v1/tasks?status=TODO → 按状态过滤")
    void listTasks_filterByStatus() throws Exception {
        when(todoAppService.listTasks("TODO", null, null))
            .thenReturn(List.of(sampleTask(1L, "待办任务", TaskStatus.TODO)));

        mockMvc.perform(get("/api/v1/tasks?status=TODO"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].status").value("TODO"));
    }

    @Test
    @DisplayName("POST /api/v1/tasks → 创建成功 201")
    void createTask_shouldReturn201() throws Exception {
        Task created = sampleTask(10L, "新任务", TaskStatus.TODO, TaskPriority.HIGH);
        when(todoAppService.createTask(any(Task.class))).thenReturn(created);

        mockMvc.perform(post("/api/v1/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"新任务\",\"priority\":\"HIGH\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("新任务"))
            .andExpect(jsonPath("$.priority").value("HIGH"))
            .andExpect(jsonPath("$.id").value(10));
    }

    @Test
    @DisplayName("PUT /api/v1/tasks/1 → 更新成功 200")
    void updateTask_shouldReturn200() throws Exception {
        Task updated = sampleTask(1L, "更新后的任务", TaskStatus.IN_PROGRESS);
        updated.setPriority(TaskPriority.URGENT);
        updated.setDescription("新描述");

        when(todoAppService.updateTask(eq(1L), any(Task.class))).thenReturn(updated);

        mockMvc.perform(put("/api/v1/tasks/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"更新后的任务\",\"priority\":\"URGENT\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("更新后的任务"))
            .andExpect(jsonPath("$.priority").value("URGENT"));
    }

    @Test
    @DisplayName("DELETE /api/v1/tasks/1 → 删除成功 204")
    void deleteTask_shouldReturn204() throws Exception {
        doNothing().when(todoAppService).deleteTask(1L);

        mockMvc.perform(delete("/api/v1/tasks/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("PATCH /api/v1/tasks/1/move → 移动成功 200")
    void moveTask_shouldReturn200() throws Exception {
        Task moved = sampleTask(1L, "移动的任务", TaskStatus.DONE);
        moved.setSortOrder(5);
        when(todoAppService.moveTask(1L, "DONE", 3)).thenReturn(moved);

        mockMvc.perform(patch("/api/v1/tasks/1/move")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"DONE\",\"sortOrder\":3}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("DONE"))
            .andExpect(jsonPath("$.sortOrder").value(5));
    }
}
