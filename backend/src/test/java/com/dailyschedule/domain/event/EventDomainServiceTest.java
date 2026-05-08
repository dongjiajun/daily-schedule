package com.dailyschedule.domain.event;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
}
