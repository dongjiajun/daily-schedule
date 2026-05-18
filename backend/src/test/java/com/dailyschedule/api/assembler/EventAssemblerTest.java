package com.dailyschedule.api.assembler;

import com.dailyschedule.api.generated.dto.EventCreateRequest;
import com.dailyschedule.api.generated.dto.EventResponse;
import com.dailyschedule.api.generated.dto.EventUpdateRequest;
import com.dailyschedule.domain.event.Event;
import com.dailyschedule.domain.tag.Tag;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class EventAssemblerTest {

    @Test
    @DisplayName("toDomain(EventCreateRequest)：完整字段映射")
    void toDomain_fromCreateRequest_mapsAllFields() {
        EventCreateRequest dto = new EventCreateRequest();
        dto.setTitle("演练");
        dto.setDescription("desc");
        dto.setStartTime(LocalDateTime.of(2026, 5, 9, 10, 0));
        dto.setEndTime(LocalDateTime.of(2026, 5, 9, 11, 0));
        dto.setAllDay(true);
        dto.setLocation("Room");
        dto.setColor("#abc");
        dto.setReminderMinutes(15);
        dto.setCategoryId(3L);
        dto.setTagIds(List.of(1L, 2L));

        Event e = EventAssembler.toDomain(dto);

        assertThat(e.getTitle()).isEqualTo("演练");
        assertThat(e.getDescription()).isEqualTo("desc");
        assertThat(e.getStartTime()).isEqualTo(LocalDateTime.of(2026, 5, 9, 10, 0));
        assertThat(e.getEndTime()).isEqualTo(LocalDateTime.of(2026, 5, 9, 11, 0));
        assertThat(e.getAllDay()).isTrue();
        assertThat(e.getLocation()).isEqualTo("Room");
        assertThat(e.getColor()).isEqualTo("#abc");
        assertThat(e.getReminderMinutes()).isEqualTo(15);
        assertThat(e.getCategoryId()).isEqualTo(3L);
        assertThat(e.getTagIds()).containsExactlyInAnyOrder(1L, 2L);
    }

    @Test
    @DisplayName("toDomain(EventCreateRequest)：tagIds 为 null 时不抛异常，集合保持默认空集")
    void toDomain_nullTagIds_keepsDefaultEmpty() {
        EventCreateRequest dto = new EventCreateRequest();
        dto.setTitle("x");
        dto.setStartTime(LocalDateTime.now());
        dto.setEndTime(LocalDateTime.now().plusHours(1));

        Event e = EventAssembler.toDomain(dto);

        assertThat(e.getTagIds()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("toDomain(EventUpdateRequest)：与 Create 映射等价")
    void toDomain_fromUpdateRequest_isEquivalent() {
        EventUpdateRequest dto = new EventUpdateRequest();
        dto.setTitle("更新");
        dto.setStartTime(LocalDateTime.of(2026, 5, 9, 10, 0));
        dto.setEndTime(LocalDateTime.of(2026, 5, 9, 12, 0));

        Event e = EventAssembler.toDomain(dto);

        assertThat(e.getTitle()).isEqualTo("更新");
        assertThat(e.getEndTime()).isEqualTo(LocalDateTime.of(2026, 5, 9, 12, 0));
    }

    @Test
    @DisplayName("toResponse：完整字段映射 + tagIds 转换为 TagResponse 列表")
    void toResponse_mapsAllFieldsAndTags() {
        Event e = new Event("演练",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        e.setId(99L);
        e.setDescription("desc");
        e.setAllDay(false);
        e.setLocation("Room");
        e.setColor("#abc");
        e.setReminderMinutes(15);
        e.setCategoryId(3L);
        e.setCategoryName("工作");
        e.setCategoryColor("#1890ff");
        e.setTagIds(Set.of(1L, 2L));
        Tag t1 = new Tag("Tag1", "#111"); t1.setId(1L);
        Tag t2 = new Tag("Tag2", "#222"); t2.setId(2L);
        e.setTags(List.of(t1, t2));
        e.setCreatedAt(LocalDateTime.of(2026, 5, 1, 0, 0));
        e.setUpdatedAt(LocalDateTime.of(2026, 5, 2, 0, 0));

        EventResponse resp = EventAssembler.toResponse(e);

        assertThat(resp.getId()).isEqualTo(99L);
        assertThat(resp.getTitle()).isEqualTo("演练");
        assertThat(resp.getCategoryName()).isEqualTo("工作");
        assertThat(resp.getCategoryColor()).isEqualTo("#1890ff");
        assertThat(resp.getTags())
            .extracting(t -> t.getId())
            .containsExactlyInAnyOrder(1L, 2L);
    }

    @Test
    @DisplayName("toResponse：tagIds 为空时 tags 字段为空列表")
    void toResponse_emptyTagIds_emptyList() {
        Event e = new Event("无标签",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        e.setId(1L);

        EventResponse resp = EventAssembler.toResponse(e);

        assertThat(resp.getTags()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("toResponse：当 tags 详情已加载时优先使用，包含 name+color")
    void toResponse_whenTagsLoaded_returnsFullTagInfo() {
        Event e = new Event("有标签",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        e.setId(1L);
        com.dailyschedule.domain.tag.Tag t1 = new com.dailyschedule.domain.tag.Tag("紧急", "#f00");
        t1.setId(11L);
        com.dailyschedule.domain.tag.Tag t2 = new com.dailyschedule.domain.tag.Tag("工作", "#0f0");
        t2.setId(22L);
        e.setTags(List.of(t1, t2));
        e.setTagIds(Set.of(11L, 22L));

        EventResponse resp = EventAssembler.toResponse(e);

        assertThat(resp.getTags()).hasSize(2);
        assertThat(resp.getTags()).extracting(t -> t.getName())
            .containsExactlyInAnyOrder("紧急", "工作");
        assertThat(resp.getTags()).extracting(t -> t.getColor())
            .containsExactlyInAnyOrder("#f00", "#0f0");
    }

    @Test
    @DisplayName("toResponseList：批量映射应保持顺序与一致性")
    void toResponseList_preservesOrder() {
        Event a = new Event("A",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        a.setId(1L);
        Event b = new Event("B",
            LocalDateTime.of(2026, 5, 9, 12, 0),
            LocalDateTime.of(2026, 5, 9, 13, 0));
        b.setId(2L);

        List<EventResponse> list = EventAssembler.toResponseList(List.of(a, b));

        assertThat(list).hasSize(2);
        assertThat(list.get(0).getTitle()).isEqualTo("A");
        assertThat(list.get(1).getTitle()).isEqualTo("B");
    }
}
