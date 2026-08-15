package com.dailyschedule.infrastructure.persistence.repository;

import com.dailyschedule.domain.tag.Tag;
import com.dailyschedule.domain.task.*;
import com.dailyschedule.infrastructure.persistence.mapper.TagMapper;
import com.dailyschedule.infrastructure.persistence.mapper.TaskMapper;
import com.dailyschedule.infrastructure.persistence.mapper.TaskTagMapper;
import com.dailyschedule.infrastructure.persistence.mapper.TaskTagMapper.TaskTagJoinRow;
import com.dailyschedule.infrastructure.persistence.po.TagPO;
import com.dailyschedule.infrastructure.persistence.po.TaskPO;
import com.dailyschedule.infrastructure.persistence.po.TaskTagPO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Repository
public class TaskRepositoryImpl implements TaskRepository {

    private final TaskMapper taskMapper;
    private final TaskTagMapper taskTagMapper;
    private final TagMapper tagMapper;

    public TaskRepositoryImpl(TaskMapper taskMapper, TaskTagMapper taskTagMapper, TagMapper tagMapper) {
        this.taskMapper = taskMapper;
        this.taskTagMapper = taskTagMapper;
        this.tagMapper = tagMapper;
    }

    @Override
    public Optional<Task> findById(Long id) {
        TaskPO po = taskMapper.selectById(id);
        if (po == null) return Optional.empty();
        return Optional.of(loadWithTags(List.of(po)).get(0));
    }

    @Override
    public List<Task> findByUserId(Long userId, TaskStatus status, TaskPriority priority, Long tagId) {
        String statusStr = status != null ? status.name() : null;
        String priorityStr = priority != null ? priority.name() : null;
        List<TaskPO> pos = taskMapper.selectByFilter(userId, statusStr, priorityStr, tagId);
        return loadWithTags(pos);
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

        // 回填标签详情，保证创建响应含 tags
        task.setTags(loadTagsByTagIds(task.getTagIds()));
        return task;
    }

    @Override
    @Transactional
    public Task update(Task task) {
        TaskPO po = toPO(task);
        taskMapper.updateById(po);

        // 更新标签关联：先删后插（task.tagIds 由应用层保证为最终完整集合：
        // 显式提供时为新集合，未提供时保留 findById 加载的既有关联）
        taskTagMapper.deleteByTaskId(task.getId());
        if (task.getTagIds() != null && !task.getTagIds().isEmpty()) {
            for (Long tagId : task.getTagIds()) {
                taskTagMapper.insert(new TaskTagPO(task.getId(), tagId));
            }
        }

        // 重新加载以获取 updated_at
        TaskPO updated = taskMapper.selectById(task.getId());
        task.setUpdatedAt(updated.getUpdatedAt());

        // 回填标签详情，保证更新响应反映最新关联
        task.setTags(loadTagsByTagIds(task.getTagIds()));
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

    /** 批量 JOIN 查询标签并按任务分组回填（参照 EventRepositoryImpl.loadWithTags，防 N+1）。 */
    private List<Task> loadWithTags(List<TaskPO> pos) {
        if (pos == null || pos.isEmpty()) return List.of();
        List<Task> tasks = pos.stream().map(this::toDomain).collect(Collectors.toList());
        Map<Long, Task> byId = tasks.stream()
            .collect(Collectors.toMap(Task::getId, t -> t));

        List<TaskTagJoinRow> rows = taskTagMapper.selectTagsByTaskIds(byId.keySet());
        Map<Long, List<Tag>> tagsByTask = new HashMap<>();
        Map<Long, List<Long>> tagIdsByTask = new HashMap<>();
        for (TaskTagJoinRow row : rows) {
            Tag tag = new Tag();
            tag.setId(row.getId());
            tag.setName(row.getName());
            tag.setColor(row.getColor());
            tag.setCreatedAt(row.getCreatedAt());
            tag.setUpdatedAt(row.getUpdatedAt());
            tagsByTask.computeIfAbsent(row.getTaskIdRef(), k -> new ArrayList<>()).add(tag);
            tagIdsByTask.computeIfAbsent(row.getTaskIdRef(), k -> new ArrayList<>()).add(row.getId());
        }
        for (Task t : tasks) {
            t.setTags(tagsByTask.getOrDefault(t.getId(), Collections.emptyList()));
            t.setTagIds(tagIdsByTask.getOrDefault(t.getId(), Collections.emptyList()));
        }
        return tasks;
    }

    /** 按 tagIds 批量加载标签详情（save/update 返回前回填用）。 */
    private List<Tag> loadTagsByTagIds(List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) return Collections.emptyList();
        return tagMapper.selectBatchIds(tagIds).stream()
            .map(this::toTagDomain)
            .collect(Collectors.toList());
    }

    private Tag toTagDomain(TagPO po) {
        Tag tag = new Tag();
        tag.setId(po.getId());
        tag.setName(po.getName());
        tag.setColor(po.getColor());
        tag.setCreatedAt(po.getCreatedAt());
        tag.setUpdatedAt(po.getUpdatedAt());
        return tag;
    }
}
