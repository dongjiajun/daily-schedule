package com.dailyschedule.application.event;

import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.domain.event.Event;
import com.dailyschedule.domain.event.EventDomainService;
import com.dailyschedule.domain.event.EventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventApplicationServiceTest {

    @Mock
    private EventRepository eventRepository;

    private EventApplicationService appService;
    private final EventDomainService domainService = new EventDomainService();

    @BeforeEach
    void setUp() {
        appService = new EventApplicationService(eventRepository, domainService);
    }

    @Test
    @DisplayName("创建日程 → 有效参数应成功保存")
    void create_validEvent_shouldSave() {
        Event event = new Event("团队周会",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        when(eventRepository.findByRange(any(), any(), any(), any(), any(Integer.class), any(Integer.class))).thenReturn(List.of());
        when(eventRepository.save(any())).thenAnswer(inv -> {
            Event e = inv.getArgument(0);
            e.setId(1L);
            return e;
        });

        Event saved = appService.create(event);
        assertThat(saved.getId()).isEqualTo(1L);
        verify(eventRepository).save(any());
    }

    @Test
    @DisplayName("创建日程 → 标题为空应抛异常")
    void create_emptyTitle_shouldThrow() {
        Event event = new Event("",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));

        assertThatThrownBy(() -> appService.create(event))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("标题和时间为必填");
    }

    @Test
    @DisplayName("创建日程 → 时间冲突应抛异常")
    void create_timeConflict_shouldThrow() {
        Event existing = new Event("已有日程",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        existing.setId(1L);
        when(eventRepository.findByRange(any(), any(), any(), any(), any(Integer.class), any(Integer.class))).thenReturn(List.of(existing));

        Event newEvent = new Event("新日程",
            LocalDateTime.of(2026, 5, 10, 9, 30),
            LocalDateTime.of(2026, 5, 10, 10, 30));

        assertThatThrownBy(() -> appService.create(newEvent))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("该时段已有其他日程");
    }

    @Test
    @DisplayName("按范围查询 → 应返回日程列表")
    void listByRange_shouldReturnEvents() {
        LocalDateTime start = LocalDateTime.of(2026, 5, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 5, 31, 23, 59);
        Event event = new Event("五月日程", start, end);
        when(eventRepository.findByRange(eq(start), eq(end), eq(1L), eq(null), eq(1), eq(50))).thenReturn(List.of(event));
        when(eventRepository.countByRange(eq(start), eq(end), eq(1L), eq(null))).thenReturn(1L);

        var result = appService.listByRange(start, end, null, 1L, null, 1, 50);
        assertThat(result.events()).hasSize(1);
        assertThat(result.total()).isEqualTo(1);
    }

    @Test
    @DisplayName("删除日程 → 不存在的 ID 应抛异常")
    void delete_notFound_shouldThrow() {
        when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appService.delete(999L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("日程不存在");
        verify(eventRepository, never()).delete(any());
    }
}
