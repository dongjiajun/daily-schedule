package com.dailyschedule.api.controller;

import com.dailyschedule.api.assembler.TodoAssembler;
import com.dailyschedule.api.generated.api.TasksApi;
import com.dailyschedule.api.generated.dto.CreateTaskRequest;
import com.dailyschedule.api.generated.dto.MoveTaskRequest;
import com.dailyschedule.api.generated.dto.TaskProfile;
import com.dailyschedule.api.generated.dto.UpdateTaskRequest;
import com.dailyschedule.application.todo.TodoApplicationService;
import com.dailyschedule.domain.task.Task;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class TodoController implements TasksApi {

    private static final Logger log = LoggerFactory.getLogger(TodoController.class);

    private final TodoApplicationService todoAppService;

    public TodoController(TodoApplicationService todoAppService) {
        this.todoAppService = todoAppService;
    }

    @Override
    public List<TaskProfile> listTasks(String status, String priority, Long tagId) {
        log.info("listTasks: status={} priority={} tagId={}", status, priority, tagId);
        List<Task> tasks = todoAppService.listTasks(status, priority, tagId);
        return tasks.stream()
            .map(TodoAssembler::toTaskProfile)
            .collect(Collectors.toList());
    }

    @Override
    @ResponseStatus(HttpStatus.CREATED)
    public TaskProfile createTask(@Valid CreateTaskRequest request) {
        log.info("createTask: title={}", request.getTitle());
        Task created = todoAppService.createTask(TodoAssembler.toDomain(request));
        return TodoAssembler.toTaskProfile(created);
    }

    @Override
    public TaskProfile updateTask(Long id, @Valid UpdateTaskRequest request) {
        log.info("updateTask: id={}", id);
        Task updated = todoAppService.updateTask(id, TodoAssembler.toDomain(request));
        return TodoAssembler.toTaskProfile(updated);
    }

    @Override
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(Long id) {
        log.info("deleteTask: id={}", id);
        todoAppService.deleteTask(id);
    }

    @Override
    public TaskProfile moveTask(Long id, @Valid MoveTaskRequest request) {
        log.info("moveTask: id={} status={}", id, request.getStatus());
        int sortOrder = request.getSortOrder() != null ? request.getSortOrder() : 0;
        Task moved = todoAppService.moveTask(id, request.getStatus().getValue(), sortOrder);
        return TodoAssembler.toTaskProfile(moved);
    }
}
