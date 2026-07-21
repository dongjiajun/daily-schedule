package com.dailyschedule.api.assembler;

import com.dailyschedule.api.generated.dto.TagResponse;
import com.dailyschedule.api.generated.dto.TaskProfile;
import com.dailyschedule.domain.task.Task;

import java.util.Collections;
import java.util.List;

public class TodoAssembler {

    private TodoAssembler() {}

    public static TaskProfile toTaskProfile(Task task) {
        if (task == null) return null;
        return new TaskProfile()
            .id(task.getId())
            .title(task.getTitle())
            .description(task.getDescription())
            .status(task.getStatus() != null ? task.getStatus().name() : null)
            .priority(task.getPriority() != null ? task.getPriority().name() : null)
            .sortOrder(task.getSortOrder())
            .dueDate(task.getDueDate())
            .tags(Collections.emptyList()) // 标签由 Controller 填充
            .createdAt(task.getCreatedAt())
            .updatedAt(task.getUpdatedAt());
    }

    public static TaskProfile toTaskProfile(Task task, List<TagResponse> tags) {
        TaskProfile profile = toTaskProfile(task);
        if (profile != null && tags != null) {
            profile.setTags(tags);
        }
        return profile;
    }
}
