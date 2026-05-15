package com.dailyschedule.domain.event;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EventDomainServiceTest {

    private EventDomainService domainService;

    @BeforeEach
    void setUp() {
        domainService = new EventDomainService();
    }

    @Test
    @DisplayName("时间冲突检测 → 同一时段已有事件应返回 true")
    void hasTimeConflict_whenOverlap_returnsTrue() {
        Event existing = new Event("Meeting",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        existing.setId(1L);

        Event newEvent = new Event("Another",
            LocalDateTime.of(2026, 5, 9, 10, 30),
            LocalDateTime.of(2026, 5, 9, 11, 30));

        boolean conflict = domainService.hasTimeConflict(newEvent, List.of(existing));
        assertThat(conflict).isTrue();
    }

    @Test
    @DisplayName("时间冲突检测 → 不重叠时应返回 false")
    void hasTimeConflict_whenNoOverlap_returnsFalse() {
        Event existing = new Event("Meeting",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        existing.setId(1L);

        Event newEvent = new Event("Another",
            LocalDateTime.of(2026, 5, 9, 11, 0),
            LocalDateTime.of(2026, 5, 9, 12, 0));

        boolean conflict = domainService.hasTimeConflict(newEvent, List.of(existing));
        assertThat(conflict).isFalse();
    }

    @Test
    @DisplayName("时间冲突检测 → 自身编辑应被排除")
    void hasTimeConflict_whenEditingSelf_returnsFalse() {
        Event self = new Event("Meeting",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        self.setId(1L);

        boolean conflict = domainService.hasTimeConflict(self, List.of(self));
        assertThat(conflict).isFalse();
    }

    @Test
    @DisplayName("领域校验 → 结束时间早于开始时间无效")
    void isValid_whenEndBeforeStart_returnsFalse() {
        Event event = new Event("Bad",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 9, 0));
        assertThat(event.isValid()).isFalse();
    }

    @Test
    @DisplayName("领域校验 → 标题为空无效")
    void isValid_whenTitleEmpty_returnsFalse() {
        Event event = new Event("",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        assertThat(event.isValid()).isFalse();
    }

    @Test
    @DisplayName("领域校验 → 标题仅空白字符无效")
    void isValid_whenTitleBlank_returnsFalse() {
        Event event = new Event("   ",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        assertThat(event.isValid()).isFalse();
    }

    @Test
    @DisplayName("领域校验 → 开始等于结束视为有效（零长度事件）")
    void isValid_whenStartEqualsEnd_returnsTrue() {
        LocalDateTime t = LocalDateTime.of(2026, 5, 9, 10, 0);
        Event event = new Event("Instant", t, t);
        assertThat(event.isValid()).isTrue();
    }

    @Test
    @DisplayName("时间冲突检测 → 边界相接不算冲突（开区间）")
    void hasTimeConflict_whenAdjacent_returnsFalse() {
        Event existing = new Event("A",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        existing.setId(1L);

        Event newEvent = new Event("B",
            LocalDateTime.of(2026, 5, 9, 9, 0),
            LocalDateTime.of(2026, 5, 9, 10, 0));
        newEvent.setId(2L);

        boolean conflict = domainService.hasTimeConflict(newEvent, List.of(existing));
        assertThat(conflict).isFalse();
    }

    @Test
    @DisplayName("时间冲突检测 → 新事件完全包含已有事件视为冲突")
    void hasTimeConflict_whenContaining_returnsTrue() {
        Event existing = new Event("A",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        existing.setId(1L);

        Event newEvent = new Event("B",
            LocalDateTime.of(2026, 5, 9, 9, 0),
            LocalDateTime.of(2026, 5, 9, 12, 0));
        newEvent.setId(2L);

        boolean conflict = domainService.hasTimeConflict(newEvent, List.of(existing));
        assertThat(conflict).isTrue();
    }

    @Test
    @DisplayName("时间冲突检测 → 新事件被已有事件完全包含视为冲突")
    void hasTimeConflict_whenContained_returnsTrue() {
        Event existing = new Event("A",
            LocalDateTime.of(2026, 5, 9, 9, 0),
            LocalDateTime.of(2026, 5, 9, 12, 0));
        existing.setId(1L);

        Event newEvent = new Event("B",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        newEvent.setId(2L);

        boolean conflict = domainService.hasTimeConflict(newEvent, List.of(existing));
        assertThat(conflict).isTrue();
    }

    @Test
    @DisplayName("时间冲突检测 → 多事件中仅检测到一个冲突也返回 true")
    void hasTimeConflict_amongManyNonConflictsAndOneConflict_returnsTrue() {
        Event before = new Event("Before",
            LocalDateTime.of(2026, 5, 9, 7, 0),
            LocalDateTime.of(2026, 5, 9, 8, 0));
        before.setId(1L);
        Event overlap = new Event("Overlap",
            LocalDateTime.of(2026, 5, 9, 10, 30),
            LocalDateTime.of(2026, 5, 9, 11, 30));
        overlap.setId(2L);
        Event after = new Event("After",
            LocalDateTime.of(2026, 5, 9, 14, 0),
            LocalDateTime.of(2026, 5, 9, 15, 0));
        after.setId(3L);

        Event newEvent = new Event("New",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        newEvent.setId(99L);

        boolean conflict = domainService.hasTimeConflict(newEvent, List.of(before, overlap, after));
        assertThat(conflict).isTrue();
    }

    @Test
    @DisplayName("时间冲突检测 → 空列表返回 false")
    void hasTimeConflict_whenEmpty_returnsFalse() {
        Event newEvent = new Event("Solo",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        newEvent.setId(1L);

        boolean conflict = domainService.hasTimeConflict(newEvent, List.of());
        assertThat(conflict).isFalse();
    }

    @Test
    @DisplayName("Event.update → 仅更新非 null 字段，保留原值")
    void update_onlyAppliesNonNullFields() {
        Event event = new Event("原标题",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        event.setColor("#1890ff");
        event.setLocation("会议室 A");

        Event patch = new Event();
        patch.setTitle("新标题");

        event.update(patch);

        assertThat(event.getTitle()).isEqualTo("新标题");
        assertThat(event.getColor()).isEqualTo("#1890ff");
        assertThat(event.getLocation()).isEqualTo("会议室 A");
    }
}
