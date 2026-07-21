package com.dailyschedule.domain.task;

import java.util.List;
import java.util.Optional;

public interface TaskRepository {
    Optional<Task> findById(Long id);
    List<Task> findByUserId(Long userId, TaskStatus status, TaskPriority priority, Long tagId);
    Task save(Task task);
    Task update(Task task);
    void delete(Long id);
    void updateStatus(Long id, TaskStatus status, int sortOrder);
    int getMaxSortOrder(Long userId, TaskStatus status);
}
