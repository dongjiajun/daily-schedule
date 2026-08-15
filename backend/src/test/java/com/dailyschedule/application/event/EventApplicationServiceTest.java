package com.dailyschedule.application.event;

import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.application.pet.PetApplicationService;
import com.dailyschedule.domain.event.Event;
import com.dailyschedule.domain.event.EventDomainService;
import com.dailyschedule.domain.event.EventFilter;
import com.dailyschedule.domain.event.EventRepository;
import com.dailyschedule.domain.event.EventStatus;
import com.dailyschedule.domain.pet.RewardSource;
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

    @Mock
    private PetApplicationService petApplicationService;

    private EventApplicationService appService;
    private final EventDomainService domainService = new EventDomainService();

    @BeforeEach
    void setUp() {
        appService = new EventApplicationService(eventRepository, domainService, petApplicationService);
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
        when(eventRepository.findByRange(eq(start), eq(end), eq(1L), eq(EventFilter.NONE), eq(1), eq(50))).thenReturn(List.of(event));
        when(eventRepository.countByRange(eq(start), eq(end), eq(1L), eq(EventFilter.NONE))).thenReturn(1L);

        var result = appService.listByRange(start, end, 1L, EventFilter.NONE, 1, 50);
        assertThat(result.events()).hasSize(1);
        assertThat(result.total()).isEqualTo(1);
    }

    @Test
    @DisplayName("按范围查询 → 标签/状态过滤条件应原样传给仓储")
    void listByRange_passesFilterThrough() {
        LocalDateTime start = LocalDateTime.of(2026, 5, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 5, 31, 23, 59);
        EventFilter filter = new EventFilter(2L, 7L, EventStatus.COMPLETED, "复盘");
        when(eventRepository.findByRange(eq(start), eq(end), eq(1L), eq(filter), eq(1), eq(50))).thenReturn(List.of());
        when(eventRepository.countByRange(eq(start), eq(end), eq(1L), eq(filter))).thenReturn(0L);

        var result = appService.listByRange(start, end, 1L, filter, 1, 50);
        assertThat(result.total()).isZero();
        verify(eventRepository).findByRange(eq(start), eq(end), eq(1L), eq(filter), eq(1), eq(50));
    }

    @Test
    @DisplayName("创建日程 → 与已完成日程时间重叠不算冲突")
    void create_overlapWithCompleted_shouldNotConflict() {
        Event completed = new Event("已完成日程",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        completed.setId(1L);
        completed.setStatus(EventStatus.COMPLETED);
        when(eventRepository.findByRange(any(), any(), any(), any(), any(Integer.class), any(Integer.class)))
            .thenReturn(List.of(completed));
        when(eventRepository.save(any())).thenAnswer(inv -> {
            Event e = inv.getArgument(0);
            e.setId(2L);
            return e;
        });

        Event newEvent = new Event("新日程",
            LocalDateTime.of(2026, 5, 10, 9, 30),
            LocalDateTime.of(2026, 5, 10, 10, 30));

        Event saved = appService.create(newEvent);
        assertThat(saved.getId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("删除日程 → 不存在的 ID 应抛异常")
    void delete_notFound_shouldThrow() {
        when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appService.delete(999L, 1L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("日程不存在");
        verify(eventRepository, never()).delete(any());
    }

    // ─── 宠物奖励挂钩 ───

    @Test
    @DisplayName("update → PLANNED 迁移为 COMPLETED → 发放 EVENT_COMPLETED 奖励")
    void update_plannedToCompleted_grantsReward() {
        Event existing = new Event("周会",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        existing.setId(5L);
        existing.setUserId(1L);
        existing.setStatus(EventStatus.PLANNED);
        when(eventRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        Event data = new Event("周会",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        data.setStatus(EventStatus.COMPLETED);

        Event result = appService.update(5L, data, 1L);
        assertThat(result.getStatus()).isEqualTo(EventStatus.COMPLETED);
        verify(petApplicationService).grantReward(RewardSource.EVENT_COMPLETED, "5");
    }

    @Test
    @DisplayName("update → 已 COMPLETED 再次更新 → 不重复发放")
    void update_completedToCompleted_noReward() {
        Event existing = new Event("周会",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        existing.setId(5L);
        existing.setUserId(1L);
        existing.setStatus(EventStatus.COMPLETED);
        when(eventRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        Event data = new Event("周会",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        data.setStatus(EventStatus.COMPLETED);

        appService.update(5L, data, 1L);
        verify(petApplicationService, never()).grantReward(any(), anyString());
    }

    @Test
    @DisplayName("delete → 删除 PLANNED 日程 → 发放 EVENT_CANCELLED 负面奖励")
    void delete_planned_grantsCancellationReward() {
        Event existing = new Event("要取消的日程",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        existing.setId(3L);
        existing.setUserId(1L);
        existing.setStatus(EventStatus.PLANNED);
        when(eventRepository.findById(3L)).thenReturn(Optional.of(existing));

        appService.delete(3L, 1L);
        verify(eventRepository).delete(3L);
        verify(petApplicationService).grantReward(RewardSource.EVENT_CANCELLED, "3");
    }

    @Test
    @DisplayName("delete → 删除 COMPLETED 日程 → 不惩罚")
    void delete_completed_noReward() {
        Event existing = new Event("已完成日程",
            LocalDateTime.of(2026, 5, 10, 9, 0),
            LocalDateTime.of(2026, 5, 10, 10, 0));
        existing.setId(4L);
        existing.setUserId(1L);
        existing.setStatus(EventStatus.COMPLETED);
        when(eventRepository.findById(4L)).thenReturn(Optional.of(existing));

        appService.delete(4L, 1L);
        verify(eventRepository).delete(4L);
        verify(petApplicationService, never()).grantReward(any(), anyString());
    }
}
