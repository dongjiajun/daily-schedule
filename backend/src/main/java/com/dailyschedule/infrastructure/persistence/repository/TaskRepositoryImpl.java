package com.dailyschedule.infrastructure.persistence.repository;

import com.dailyschedule.domain.task.*;
import com.dailyschedule.infrastructure.persistence.mapper.TaskMapper;
import com.dailyschedule.infrastructure.persistence.mapper.TaskTagMapper;
import com.dailyschedule.infrastructure.persistence.po.TaskPO;
import com.dailyschedule.infrastructure.persistence.po.TaskTagPO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class TaskRepositoryImpl implements TaskRepository {

    private final TaskMapper taskMapper;
    private final TaskTagMapper taskTagMapper;

    public TaskRepositoryImpl(TaskMapper taskMapper, TaskTagMapper taskTagMapper) {
        this.taskMapper = taskMapper;
        this.taskTagMapper = taskTagMapper;
    }

    @Override
    public Optional<Task> findById(Long id) {
        TaskPO po = taskMapper.selectById(id);
        if (po == null) return Optional.empty();
        return Optional.of(toDomain(po));
    }

    @Override
    public List<Task> findByUserId(Long userId, TaskStatus status, TaskPriority priority, Long tagId) {
        String statusStr = status != null ? status.name() : null;
        String priorityStr = priority != null ? priority.name() : null;
        List<TaskPO> pos = taskMapper.selectByFilter(userId, statusStr, priorityStr, tagId);
        return pos.stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Task save(Task task) {
        TaskPO po = toPO(task);
        taskMapper.insert(po);
        task.setId(po.getId());
        task.setCreatedAt(po.getCreatedAt());
        task.setUpdatedAt(po.getUpdatedAt());

        // 插入标签关联
        if (task.getTagIds() != null && !task.getTagIds().isEmpty()) {
            for (Long tagId : task.getTagIds()) {
                taskTagMapper.insert(new TaskTagPO(task.getId(), tagId));
            }
        }
        return task;
    }

    @Override
    @Transactional
    public Task update(Task task) {
        TaskPO po = toPO(task);
        taskMapper.updateById(po);

        // 更新标签关联：先删后插
        taskTagMapper.deleteByTaskId(task.getId());
        if (task.getTagIds() != null && !task.getTagIds().isEmpty()) {
            for (Long tagId : task.getTagIds()) {
                taskTagMapper.insert(new TaskTagPO(task.getId(), tagId));
            }
        }

        // 重新加载以获取 updated_at
        TaskPO updated = taskMapper.selectById(task.getId());
        task.setUpdatedAt(updated.getUpdatedAt());
        return task;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        taskTagMapper.deleteByTaskId(id);
        taskMapper.deleteById(id);
    }

    @Override
    public void updateStatus(Long id, TaskStatus status, int sortOrder) {
        TaskPO po = taskMapper.selectById(id);
        if (po != null) {
            po.setStatus(status.name());
            po.setSortOrder(sortOrder);
            taskMapper.updateById(po);
        }
    }

    @Override
    public int getMaxSortOrder(Long userId, TaskStatus status) {
        return taskMapper.getMaxSortOrder(userId, status.name());
    }

    private Task toDomain(TaskPO po) {
        Task task = new Task();
        task.setId(po.getId());
        task.setUserId(po.getUserId());
        task.setTitle(po.getTitle());
        task.setDescription(po.getDescription());
        task.setStatus(TaskStatus.fromString(po.getStatus()));
        task.setPriority(TaskPriority.fromString(po.getPriority()));
        task.setSortOrder(po.getSortOrder() != null ? po.getSortOrder() : 0);
        task.setDueDate(po.getDueDate());
        task.setTagIds(po.getTagIds() != null ? po.getTagIds() : Collections.emptyList());
        task.setCreatedAt(po.getCreatedAt());
        task.setUpdatedAt(po.getUpdatedAt());
        return task;
    }

    private TaskPO toPO(Task task) {
        TaskPO po = new TaskPO();
        po.setId(task.getId());
        po.setUserId(task.getUserId());
        po.setTitle(task.getTitle());
        po.setDescription(task.getDescription());
        po.setStatus(task.getStatus() != null ? task.getStatus().name() : null);
        po.setPriority(task.getPriority() != null ? task.getPriority().name() : null);
        po.setSortOrder(task.getSortOrder());
        po.setDueDate(task.getDueDate());
        return po;
    }
}
