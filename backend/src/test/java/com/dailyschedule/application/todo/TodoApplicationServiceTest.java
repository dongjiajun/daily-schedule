package com.dailyschedule.application.todo;

import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.domain.task.*;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TodoApplicationServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskDomainService domainService;

    @Mock
    private CurrentUserService currentUserService;

    private TodoApplicationService service;

    @BeforeEach
    void setUp() {
        service = new TodoApplicationService(taskRepository, domainService, currentUserService);
    }

    // ─── listTasks ───

    @Test
    @DisplayName("listTasks → 按状态过滤 → 返回正确结果")
    void listTasks_byStatus() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        Task task = sampleTask(1L, "任务A", TaskStatus.TODO);
        when(taskRepository.findByUserId(1L, TaskStatus.TODO, null, null))
            .thenReturn(List.of(task));

        List<Task> results = service.listTasks("TODO", null, null);
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("任务A");
    }

    // ─── createTask ───

    @Test
    @DisplayName("createTask → 成功创建 → 返回带 ID 的任务")
    void createTask_success() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);

        Task input = new Task();
        input.setTitle("新任务");
        input.setPriority(TaskPriority.HIGH);
        input.setDescription("说明");
        input.setStatus(TaskStatus.TODO);

        doAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(10L);
            return t;
        }).when(taskRepository).save(any(Task.class));

        Task result = service.createTask(input);
        assertThat(result.getId()).isEqualTo(10L);
        verify(domainService).initializeDefaults(any(Task.class), eq(taskRepository));
    }

    @Test
    @DisplayName("createTask → 标题为空 → 抛出异常")
    void createTask_emptyTitle_throws() {
        Task input = new Task();
        input.setTitle("");

        assertThatThrownBy(() -> service.createTask(input))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("标题不能为空");
    }

    // ─── updateTask ───

    @Test
    @DisplayName("updateTask → 部分更新 → 仅更新提供字段")
    void updateTask_partialUpdate() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);

        Task existing = sampleTask(1L, "旧标题", TaskStatus.TODO);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(existing));

        Task updates = new Task();
        updates.setTitle("新标题");
        updates.setPriority(TaskPriority.URGENT);

        when(taskRepository.update(any(Task.class))).thenReturn(existing);

        Task result = service.updateTask(1L, updates);
        assertThat(result.getTitle()).isEqualTo("新标题");
    }

    @Test
    @DisplayName("updateTask → 任务不存在 → 抛出 404")
    void updateTask_notFound_throws() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateTask(99L, new Task()))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("任务不存在");
    }

    @Test
    @DisplayName("updateTask → 他人任务 → 抛出 404")
    void updateTask_otherUsersTask_throws() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);

        Task otherTask = sampleTask(2L, "别人的任务", TaskStatus.TODO);
        otherTask.setUserId(2L);
        when(taskRepository.findById(2L)).thenReturn(Optional.of(otherTask));

        assertThatThrownBy(() -> service.updateTask(2L, new Task()))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── deleteTask ───

    @Test
    @DisplayName("deleteTask → 成功删除")
    void deleteTask_success() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        Task existing = sampleTask(1L, "删除我", TaskStatus.TODO);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(existing));

        service.deleteTask(1L);
        verify(taskRepository).delete(1L);
    }

    // ─── moveTask ───

    @Test
    @DisplayName("moveTask → 移动到目标列 → 更新状态")
    void moveTask_toTargetColumn() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        Task existing = sampleTask(1L, "任务", TaskStatus.TODO);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(existing));

        Task result = service.moveTask(1L, "DONE", 5);
        assertThat(result.getStatus()).isEqualTo(TaskStatus.DONE);
        assertThat(result.getSortOrder()).isEqualTo(5);
        verify(taskRepository).updateStatus(1L, TaskStatus.DONE, 5);
    }

    private Task sampleTask(Long id, String title, TaskStatus status) {
        Task task = new Task();
        task.setId(id);
        task.setUserId(1L);
        task.setTitle(title);
        task.setStatus(status);
        task.setPriority(TaskPriority.MEDIUM);
        return task;
    }
}
