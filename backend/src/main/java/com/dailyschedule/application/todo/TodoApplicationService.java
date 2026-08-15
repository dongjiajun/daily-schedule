package com.dailyschedule.application.todo;

import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.application.pet.PetApplicationService;
import com.dailyschedule.domain.pet.RewardSource;
import com.dailyschedule.domain.task.*;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TodoApplicationService {

    private final TaskRepository taskRepository;
    private final TaskDomainService domainService;
    private final PetApplicationService petApplicationService;
    private final CurrentUserService currentUserService;

    public TodoApplicationService(TaskRepository taskRepository,
                                   TaskDomainService domainService,
                                   PetApplicationService petApplicationService,
                                   CurrentUserService currentUserService) {
        this.taskRepository = taskRepository;
        this.domainService = domainService;
        this.petApplicationService = petApplicationService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<Task> listTasks(String status, String priority, Long tagId) {
        Long userId = currentUserService.getCurrentUserId();
        TaskStatus taskStatus = status != null ? TaskStatus.fromString(status) : null;
        TaskPriority taskPriority = priority != null ? TaskPriority.fromString(priority) : null;
        return taskRepository.findByUserId(userId, taskStatus, taskPriority, tagId);
    }

    @Transactional
    public Task createTask(Task task) {
        Long userId = currentUserService.getCurrentUserId();
        task.setUserId(userId);

        if (task.getTitle() == null || task.getTitle().isBlank()) {
            throw new IllegalArgumentException("任务标题不能为空");
        }

        domainService.initializeDefaults(task, taskRepository);

        if (!task.isValid()) {
            throw new IllegalArgumentException("任务数据不合法");
        }

        return taskRepository.save(task);
    }

    @Transactional
    public Task updateTask(Long id, Task updates) {
        Task task = findOwnTask(id);

        if (updates.getTitle() != null) {
            if (updates.getTitle().isBlank()) {
                throw new IllegalArgumentException("任务标题不能为空");
            }
            task.setTitle(updates.getTitle());
        }
        if (updates.getDescription() != null) {
            task.setDescription(updates.getDescription());
        }
        if (updates.getPriority() != null) {
            task.setPriority(updates.getPriority());
        }
        if (updates.getDueDate() != null) {
            task.setDueDate(updates.getDueDate());
        }
        // 生成 DTO 的 tagIds 默认为空列表，"未提供"与"清空"不可区分：
        // 空列表视为"未触及标签"（保留既有），显式非空列表为替换语义。
        if (updates.getTagIds() != null && !updates.getTagIds().isEmpty()) {
            task.setTagIds(updates.getTagIds());
        }

        return taskRepository.update(task);
    }

    @Transactional
    public void deleteTask(Long id) {
        findOwnTask(id);
        taskRepository.delete(id);
    }

    @Transactional
    public Task moveTask(Long id, String status, int sortOrder) {
        Task task = findOwnTask(id);
        TaskStatus previousStatus = task.getStatus();
        TaskStatus targetStatus = TaskStatus.fromString(status);
        taskRepository.updateStatus(id, targetStatus, sortOrder);
        task.setStatus(targetStatus);
        task.setSortOrder(sortOrder);

        // 完成挂钩：非 DONE → DONE 迁移发放宠物奖励（幂等，同事务；无宠物时 grantReward 静默跳过）
        if (targetStatus == TaskStatus.DONE && previousStatus != TaskStatus.DONE) {
            petApplicationService.grantReward(RewardSource.TASK_COMPLETED, String.valueOf(id));
        }
        return task;
    }

    private Task findOwnTask(Long id) {
        Long userId = currentUserService.getCurrentUserId();
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("任务不存在"));
        if (!task.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("任务不存在");
        }
        return task;
    }
}
