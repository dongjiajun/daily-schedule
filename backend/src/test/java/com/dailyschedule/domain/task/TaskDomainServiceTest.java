package com.dailyschedule.domain.task;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskDomainServiceTest {

    private TaskDomainService domainService;

    @Mock
    private TaskRepository taskRepository;

    @BeforeEach
    void setUp() {
        domainService = new TaskDomainService();
    }

    @Test
    @DisplayName("初始化默认值 → status 和 priority 为 null → 自动填充 TODO + MEDIUM")
    void initializeDefaults_nullStatusAndPriority() {
        Task task = new Task();
        task.setUserId(1L);
        task.setTitle("测试任务");

        when(taskRepository.getMaxSortOrder(1L, TaskStatus.TODO)).thenReturn(3);

        domainService.initializeDefaults(task, taskRepository);

        assertThat(task.getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(task.getPriority()).isEqualTo(TaskPriority.MEDIUM);
        assertThat(task.getSortOrder()).isEqualTo(4);
    }

    @Test
    @DisplayName("初始化默认值 → status 已有值 → 不覆盖已有 status")
    void initializeDefaults_existingStatus_preserved() {
        Task task = new Task();
        task.setUserId(1L);
        task.setTitle("进行中任务");
        task.setStatus(TaskStatus.IN_PROGRESS);
        task.setPriority(TaskPriority.HIGH);

        when(taskRepository.getMaxSortOrder(1L, TaskStatus.IN_PROGRESS)).thenReturn(0);

        domainService.initializeDefaults(task, taskRepository);

        assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
        assertThat(task.getPriority()).isEqualTo(TaskPriority.HIGH);
        assertThat(task.getSortOrder()).isEqualTo(1);
    }

    @Test
    @DisplayName("初始化默认值 → sortOrder 从 0 开始")
    void initializeDefaults_firstTask_orderOne() {
        Task task = new Task();
        task.setUserId(1L);
        task.setTitle("首个任务");

        when(taskRepository.getMaxSortOrder(1L, TaskStatus.TODO)).thenReturn(0);

        domainService.initializeDefaults(task, taskRepository);

        assertThat(task.getSortOrder()).isEqualTo(1);
    }

    @Test
    @DisplayName("移动任务 → 换列时 sortOrder 设为目标列最大值+1")
    void assignSortOrderForMove_toNewColumn() {
        Task task = new Task();
        task.setUserId(1L);
        task.setStatus(TaskStatus.TODO);

        when(taskRepository.getMaxSortOrder(1L, TaskStatus.IN_PROGRESS)).thenReturn(5);

        domainService.assignSortOrderForMove(task, TaskStatus.IN_PROGRESS, taskRepository);

        assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
        assertThat(task.getSortOrder()).isEqualTo(6);
    }

    @Test
    @DisplayName("移动任务 → 目标列为空列 → sortOrder=1")
    void assignSortOrderForMove_emptyTargetColumn() {
        Task task = new Task();
        task.setUserId(1L);
        task.setStatus(TaskStatus.TODO);

        when(taskRepository.getMaxSortOrder(1L, TaskStatus.DONE)).thenReturn(0);

        domainService.assignSortOrderForMove(task, TaskStatus.DONE, taskRepository);

        assertThat(task.getSortOrder()).isEqualTo(1);
    }
}
