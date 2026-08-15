package com.dailyschedule.api.assembler;

import com.dailyschedule.api.generated.dto.CreateTaskRequest;
import com.dailyschedule.api.generated.dto.TaskProfile;
import com.dailyschedule.api.generated.dto.UpdateTaskRequest;
import com.dailyschedule.domain.tag.Tag;
import com.dailyschedule.domain.task.Task;
import com.dailyschedule.domain.task.TaskPriority;
import com.dailyschedule.domain.task.TaskStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TodoAssemblerTest {

    @Test
    @DisplayName("toDomain(CreateTaskRequest)：完整字段映射")
    void toDomain_fromCreateRequest_mapsAllFields() {
        CreateTaskRequest dto = new CreateTaskRequest();
        dto.setTitle("买水果");
        dto.setDescription("desc");
        dto.setPriority(CreateTaskRequest.PriorityEnum.HIGH);
        dto.setDueDate(LocalDate.of(2026, 7, 25));
        dto.setTagIds(List.of(1L, 2L));

        Task task = TodoAssembler.toDomain(dto);

        assertThat(task.getTitle()).isEqualTo("买水果");
        assertThat(task.getDescription()).isEqualTo("desc");
        assertThat(task.getPriority()).isEqualTo(TaskPriority.HIGH);
        assertThat(task.getDueDate()).isEqualTo(LocalDate.of(2026, 7, 25));
        assertThat(task.getTagIds()).containsExactlyInAnyOrder(1L, 2L);
    }

    @Test
    @DisplayName("toDomain(CreateTaskRequest)：priority/tagIds 为 null 时不抛异常")
    void toDomain_fromCreateRequest_nullOptionals_keepsDefaults() {
        CreateTaskRequest dto = new CreateTaskRequest();
        dto.setTitle("最简任务");

        Task task = TodoAssembler.toDomain(dto);

        assertThat(task.getPriority()).isNull();
        assertThat(task.getTagIds()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("toDomain(UpdateTaskRequest)：与 Create 映射等价")
    void toDomain_fromUpdateRequest_isEquivalent() {
        UpdateTaskRequest dto = new UpdateTaskRequest();
        dto.setTitle("更新标题");
        dto.setPriority(UpdateTaskRequest.PriorityEnum.URGENT);
        dto.setTagIds(List.of(3L));

        Task task = TodoAssembler.toDomain(dto);

        assertThat(task.getTitle()).isEqualTo("更新标题");
        assertThat(task.getPriority()).isEqualTo(TaskPriority.URGENT);
        assertThat(task.getTagIds()).containsExactly(3L);
    }

    @Test
    @DisplayName("toDomain(UpdateTaskRequest)：未提供 tagIds → 空列表（部分更新语义由应用层判定）")
    void toDomain_fromUpdateRequest_omittedTagIds_isEmptyList() {
        UpdateTaskRequest dto = new UpdateTaskRequest();
        dto.setTitle("只改标题");

        Task task = TodoAssembler.toDomain(dto);

        assertThat(task.getTitle()).isEqualTo("只改标题");
        assertThat(task.getTagIds()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("toTaskProfile：完整字段映射 + tags 转换为 TagResponse 列表")
    void toTaskProfile_mapsAllFieldsAndTags() {
        Task task = new Task();
        task.setId(10L);
        task.setTitle("任务");
        task.setDescription("desc");
        task.setStatus(TaskStatus.IN_PROGRESS);
        task.setPriority(TaskPriority.HIGH);
        task.setSortOrder(3);
        task.setDueDate(LocalDate.of(2026, 7, 25));
        task.setCreatedAt(LocalDateTime.of(2026, 7, 20, 9, 0));
        task.setUpdatedAt(LocalDateTime.of(2026, 7, 21, 9, 0));
        task.setTags(List.of(sampleTag(11L, "工作", "#ff0000"), sampleTag(12L, "紧急", "#00ff00")));

        TaskProfile profile = TodoAssembler.toTaskProfile(task);

        assertThat(profile.getId()).isEqualTo(10L);
        assertThat(profile.getTitle()).isEqualTo("任务");
        assertThat(profile.getDescription()).isEqualTo("desc");
        assertThat(profile.getStatus()).isEqualTo("IN_PROGRESS");
        assertThat(profile.getPriority()).isEqualTo("HIGH");
        assertThat(profile.getSortOrder()).isEqualTo(3);
        assertThat(profile.getDueDate()).isEqualTo(LocalDate.of(2026, 7, 25));
        assertThat(profile.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 7, 20, 9, 0));
        assertThat(profile.getTags()).hasSize(2);
        assertThat(profile.getTags().get(0).getId()).isEqualTo(11L);
        assertThat(profile.getTags().get(0).getName()).isEqualTo("工作");
        assertThat(profile.getTags().get(0).getColor()).isEqualTo("#ff0000");
        assertThat(profile.getTags().get(1).getName()).isEqualTo("紧急");
    }

    @Test
    @DisplayName("toTaskProfile：无标签 → tags 为空列表")
    void toTaskProfile_noTags_returnsEmptyList() {
        Task task = new Task();
        task.setTitle("无标签");
        task.setStatus(TaskStatus.TODO);
        task.setPriority(TaskPriority.MEDIUM);

        TaskProfile profile = TodoAssembler.toTaskProfile(task);

        assertThat(profile.getTags()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("toTaskProfile：null 输入 → null")
    void toTaskProfile_nullInput_returnsNull() {
        assertThat(TodoAssembler.toTaskProfile(null)).isNull();
    }

    private Tag sampleTag(Long id, String name, String color) {
        Tag tag = new Tag();
        tag.setId(id);
        tag.setName(name);
        tag.setColor(color);
        return tag;
    }
}
