package com.dailyschedule.domain.task;

import org.springframework.stereotype.Component;

@Component
public class TaskDomainService {

    /**
     * 为新任务填充默认值：status=TODO, priority=MEDIUM, sortOrder=该状态下最大值+1。
     */
    public void initializeDefaults(Task task, TaskRepository repository) {
        if (task.getStatus() == null) {
            task.setStatus(TaskStatus.TODO);
        }
        if (task.getPriority() == null) {
            task.setPriority(TaskPriority.MEDIUM);
        }
        int maxOrder = repository.getMaxSortOrder(task.getUserId(), task.getStatus());
        task.setSortOrder(maxOrder + 1);
    }

    /**
     * 移动任务到目标状态列时，设置 sortOrder 为该列最大值+1。
     */
    public void assignSortOrderForMove(Task task, TaskStatus targetStatus, TaskRepository repository) {
        int maxOrder = repository.getMaxSortOrder(task.getUserId(), targetStatus);
        task.setSortOrder(maxOrder + 1);
        task.setStatus(targetStatus);
    }
}
