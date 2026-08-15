package com.dailyschedule.api.assembler;

import com.dailyschedule.api.generated.dto.CreateTaskRequest;
import com.dailyschedule.api.generated.dto.TagResponse;
import com.dailyschedule.api.generated.dto.TaskProfile;
import com.dailyschedule.api.generated.dto.UpdateTaskRequest;
import com.dailyschedule.domain.tag.Tag;
import com.dailyschedule.domain.task.Task;
import com.dailyschedule.domain.task.TaskPriority;

import java.util.List;
import java.util.stream.Collectors;

public class TodoAssembler {

    private TodoAssembler() {}

    public static Task toDomain(CreateTaskRequest request) {
        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        if (request.getPriority() != null) {
            task.setPriority(TaskPriority.fromString(request.getPriority().getValue()));
        }
        task.setDueDate(request.getDueDate());
        if (request.getTagIds() != null) {
            task.setTagIds(request.getTagIds());
        }
        return task;
    }

    public static Task toDomain(UpdateTaskRequest request) {
        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        if (request.getPriority() != null) {
            task.setPriority(TaskPriority.fromString(request.getPriority().getValue()));
        }
        task.setDueDate(request.getDueDate());
        // 注：生成 DTO 的 tagIds 默认为空列表，"未提供"与"清空"在 DTO 层不可区分，
        // 部分更新语义由 TodoApplicationService.updateTask 判定（空列表 = 未触及标签）。
        task.setTagIds(request.getTagIds());
        return task;
    }

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
            .tags(buildTagResponses(task))
            .createdAt(task.getCreatedAt())
            .updatedAt(task.getUpdatedAt());
    }

    private static List<TagResponse> buildTagResponses(Task task) {
        if (task.getTags() != null && !task.getTags().isEmpty()) {
            return task.getTags().stream().map(TodoAssembler::toTagResponse)
                .collect(Collectors.toList());
        }
        return List.of();
    }

    private static TagResponse toTagResponse(Tag tag) {
        TagResponse t = new TagResponse();
        t.setId(tag.getId());
        t.setName(tag.getName());
        t.setColor(tag.getColor());
        return t;
    }
}
