package com.dailyschedule.infrastructure.persistence.repository;

import com.dailyschedule.domain.task.Task;
import com.dailyschedule.domain.task.TaskPriority;
import com.dailyschedule.domain.task.TaskStatus;
import com.dailyschedule.infrastructure.persistence.mapper.TaskMapper;
import com.dailyschedule.infrastructure.persistence.mapper.TaskTagMapper;
import com.dailyschedule.infrastructure.persistence.po.TaskPO;
import com.dailyschedule.infrastructure.persistence.po.TaskTagPO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskRepositoryImplTest {

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private TaskTagMapper taskTagMapper;

    private TaskRepositoryImpl repository;

    @BeforeEach
    void setUp() {
        repository = new TaskRepositoryImpl(taskMapper, taskTagMapper);
    }

    @Test
    @DisplayName("findById → 找到 → 返回 Task")
    void findById_found_returnsTask() {
        TaskPO po = samplePO(1L, 100L, "测试任务", "TODO", "MEDIUM");
        when(taskMapper.selectById(1L)).thenReturn(po);

        Optional<Task> result = repository.findById(1L);
        assertThat(result).isPresent();
        assertThat(result.get().getTitle()).isEqualTo("测试任务");
        assertThat(result.get().getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(result.get().getPriority()).isEqualTo(TaskPriority.MEDIUM);
    }

    @Test
    @DisplayName("findById → 未找到 → Optional.empty()")
    void findById_notFound_returnsEmpty() {
        when(taskMapper.selectById(999L)).thenReturn(null);
        assertThat(repository.findById(999L)).isEmpty();
    }

    @Test
    @DisplayName("findByUserId → 按条件过滤 → 返回列表")
    void findByUserId_withFilters_returnsList() {
        TaskPO po1 = samplePO(1L, 100L, "任务A", "TODO", "HIGH");
        when(taskMapper.selectByFilter(100L, "TODO", null, null))
            .thenReturn(List.of(po1));

        List<Task> results = repository.findByUserId(100L, TaskStatus.TODO, null, null);
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("任务A");
        assertThat(results.get(0).getStatus()).isEqualTo(TaskStatus.TODO);
    }

    @Test
    @DisplayName("save → insert → 设置 id 和时间戳")
    void save_insert_setsIdAndTimestamps() {
        Task task = new Task();
        task.setUserId(100L);
        task.setTitle("新任务");
        task.setStatus(TaskStatus.TODO);
        task.setPriority(TaskPriority.MEDIUM);
        task.setTagIds(List.of(1L, 2L));

        doAnswer(inv -> {
            TaskPO po = inv.getArgument(0);
            po.setId(10L);
            po.setCreatedAt(LocalDateTime.now());
            po.setUpdatedAt(LocalDateTime.now());
            return 1;
        }).when(taskMapper).insert(any(TaskPO.class));

        Task saved = repository.save(task);
        assertThat(saved.getId()).isEqualTo(10L);
        assertThat(saved.getCreatedAt()).isNotNull();
        verify(taskTagMapper, times(2)).insert(any(TaskTagPO.class));
    }

    @Test
    @DisplayName("delete → 级联删除标签关联")
    void delete_cascadesToTaskTags() {
        repository.delete(1L);
        verify(taskTagMapper).deleteByTaskId(1L);
        verify(taskMapper).deleteById(1L);
    }

    @Test
    @DisplayName("updateStatus → 更新状态和排序")
    void updateStatus_updatesBoth() {
        TaskPO po = samplePO(1L, 100L, "任务", "TODO", "MEDIUM");
        when(taskMapper.selectById(1L)).thenReturn(po);

        repository.updateStatus(1L, TaskStatus.DONE, 5);

        assertThat(po.getStatus()).isEqualTo("DONE");
        assertThat(po.getSortOrder()).isEqualTo(5);
        verify(taskMapper).updateById(po);
    }

    @Test
    @DisplayName("getMaxSortOrder → 返回最大值")
    void getMaxSortOrder_returnsMax() {
        when(taskMapper.getMaxSortOrder(100L, "TODO")).thenReturn(3);
        assertThat(repository.getMaxSortOrder(100L, TaskStatus.TODO)).isEqualTo(3);
    }

    @Test
    @DisplayName("PO↔Domain 转换 → 包含所有字段")
    void conversion_allFieldsPreserved() {
        TaskPO po = samplePO(1L, 100L, "完整任务", "IN_PROGRESS", "URGENT");
        po.setDescription("详细描述");
        po.setSortOrder(3);
        po.setDueDate(LocalDate.of(2026, 7, 25));

        when(taskMapper.selectById(1L)).thenReturn(po);
        Optional<Task> result = repository.findById(1L);
        assertThat(result).isPresent();
        Task t = result.get();
        assertThat(t.getTitle()).isEqualTo("完整任务");
        assertThat(t.getDescription()).isEqualTo("详细描述");
        assertThat(t.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
        assertThat(t.getPriority()).isEqualTo(TaskPriority.URGENT);
        assertThat(t.getSortOrder()).isEqualTo(3);
        assertThat(t.getDueDate()).isEqualTo(LocalDate.of(2026, 7, 25));
        assertThat(t.getUserId()).isEqualTo(100L);
    }

    private TaskPO samplePO(Long id, Long userId, String title, String status, String priority) {
        TaskPO po = new TaskPO();
        po.setId(id);
        po.setUserId(userId);
        po.setTitle(title);
        po.setStatus(status);
        po.setPriority(priority);
        po.setSortOrder(0);
        po.setCreatedAt(LocalDateTime.now());
        po.setUpdatedAt(LocalDateTime.now());
        return po;
    }
}
