package com.dailyschedule.api.controller;

import com.dailyschedule.api.assembler.TodoAssembler;
import com.dailyschedule.api.generated.api.TasksApi;
import com.dailyschedule.api.generated.dto.CreateTaskRequest;
import com.dailyschedule.api.generated.dto.MoveTaskRequest;
import com.dailyschedule.api.generated.dto.TaskProfile;
import com.dailyschedule.api.generated.dto.UpdateTaskRequest;
import com.dailyschedule.application.todo.TodoApplicationService;
import com.dailyschedule.domain.task.Task;
import com.dailyschedule.domain.task.TaskPriority;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class TodoController implements TasksApi {

    private final TodoApplicationService todoAppService;

    public TodoController(TodoApplicationService todoAppService) {
        this.todoAppService = todoAppService;
    }

    @Override
    public List<TaskProfile> listTasks(String status, String priority, Long tagId) {
        List<Task> tasks = todoAppService.listTasks(status, priority, tagId);
        return tasks.stream()
            .map(TodoAssembler::toTaskProfile)
            .collect(Collectors.toList());
    }

    @Override
    @ResponseStatus(HttpStatus.CREATED)
    public TaskProfile createTask(@Valid CreateTaskRequest request) {
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

        Task created = todoAppService.createTask(task);
        return TodoAssembler.toTaskProfile(created);
    }

    @Override
    public TaskProfile updateTask(Long id, @Valid UpdateTaskRequest request) {
        Task updates = new Task();
        updates.setTitle(request.getTitle());
        updates.setDescription(request.getDescription());
        if (request.getPriority() != null) {
            updates.setPriority(TaskPriority.fromString(request.getPriority().getValue()));
        }
        updates.setDueDate(request.getDueDate());
        if (request.getTagIds() != null) {
            updates.setTagIds(request.getTagIds());
        }

        Task updated = todoAppService.updateTask(id, updates);
        return TodoAssembler.toTaskProfile(updated);
    }

    @Override
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(Long id) {
        todoAppService.deleteTask(id);
    }

    @Override
    public TaskProfile moveTask(Long id, @Valid MoveTaskRequest request) {
        int sortOrder = request.getSortOrder() != null ? request.getSortOrder() : 0;
        Task moved = todoAppService.moveTask(id, request.getStatus().getValue(), sortOrder);
        return TodoAssembler.toTaskProfile(moved);
    }
}
