package com.dailyschedule.infrastructure.persistence.repository;

import com.dailyschedule.domain.event.Event;
import com.dailyschedule.infrastructure.persistence.mapper.EventMapper;
import com.dailyschedule.infrastructure.persistence.mapper.EventTagMapper;
import com.dailyschedule.infrastructure.persistence.po.EventPO;
import com.dailyschedule.infrastructure.persistence.po.EventTagPO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventRepositoryImplTest {

    @Mock
    private EventMapper eventMapper;

    @Mock
    private EventTagMapper eventTagMapper;

    private EventRepositoryImpl repository;

    @BeforeEach
    void setUp() {
        repository = new EventRepositoryImpl(eventMapper, eventTagMapper);
    }

    @Test
    @DisplayName("PO → Domain：allDay=1 应转换为 Boolean.TRUE")
    void findByRange_convertsAllDayIntToBoolean_true() {
        EventPO po = sampleEventPO(1L, 1);
        when(eventMapper.selectByRange(any(), any())).thenReturn(List.of(po));

        List<Event> events = repository.findByRange(
            LocalDateTime.of(2026, 5, 1, 0, 0),
            LocalDateTime.of(2026, 5, 31, 23, 59));

        assertThat(events).hasSize(1);
        Event e = events.get(0);
        assertThat(e.getId()).isEqualTo(1L);
        assertThat(e.getTitle()).isEqualTo("Demo");
        assertThat(e.getAllDay()).isTrue();
        assertThat(e.getCategoryId()).isEqualTo(7L);
    }

    @Test
    @DisplayName("PO → Domain：allDay=0 应转换为 Boolean.FALSE")
    void findByRange_convertsAllDayIntToBoolean_false() {
        EventPO po = sampleEventPO(1L, 0);
        when(eventMapper.selectByRange(any(), any())).thenReturn(List.of(po));

        List<Event> events = repository.findByRange(
            LocalDateTime.of(2026, 5, 1, 0, 0),
            LocalDateTime.of(2026, 5, 31, 23, 59));

        assertThat(events.get(0).getAllDay()).isFalse();
    }

    @Test
    @DisplayName("findById：未找到时返回 Optional.empty()")
    void findById_notFound_returnsEmpty() {
        when(eventMapper.selectById(99L)).thenReturn(null);

        Optional<Event> result = repository.findById(99L);
        assertThat(result).isEmpty();
        verify(eventTagMapper, never()).selectTagIdsByEventId(any());
    }

    @Test
    @DisplayName("findById：找到时应附带 tagIds")
    void findById_found_attachesTagIds() {
        EventPO po = sampleEventPO(5L, 0);
        when(eventMapper.selectById(5L)).thenReturn(po);
        when(eventTagMapper.selectTagIdsByEventId(5L)).thenReturn(List.of(11L, 22L));

        Optional<Event> result = repository.findById(5L);

        assertThat(result).isPresent();
        assertThat(result.get().getTagIds()).containsExactlyInAnyOrder(11L, 22L);
    }

    @Test
    @DisplayName("save (insert)：新事件 → 调用 insert，回填 id，重写 event_tag")
    void save_newEvent_callsInsertAndRewritesTags() {
        Event event = new Event("会议",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        event.setAllDay(true);
        event.setColor("#abcdef");
        event.setCategoryId(3L);
        event.setTagIds(Set.of(1L, 2L));

        doAnswer(inv -> {
            EventPO po = inv.getArgument(0);
            po.setId(100L);
            po.setCreatedAt(LocalDateTime.of(2026, 5, 9, 8, 0));
            po.setUpdatedAt(LocalDateTime.of(2026, 5, 9, 8, 0));
            return 1;
        }).when(eventMapper).insert(any(EventPO.class));

        Event saved = repository.save(event);

        ArgumentCaptor<EventPO> captor = ArgumentCaptor.forClass(EventPO.class);
        verify(eventMapper).insert(captor.capture());
        EventPO inserted = captor.getValue();
        assertThat(inserted.getTitle()).isEqualTo("会议");
        assertThat(inserted.getAllDay()).isEqualTo(1);
        assertThat(inserted.getCategoryId()).isEqualTo(3L);

        assertThat(saved.getId()).isEqualTo(100L);
        assertThat(saved.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 5, 9, 8, 0));

        verify(eventTagMapper).deleteByEventId(100L);
        verify(eventTagMapper, times(2)).insert((EventTagPO) any(EventTagPO.class));
    }

    @Test
    @DisplayName("save (update)：已有 id → 调用 updateById，重写 event_tag")
    void save_existingEvent_callsUpdateById() {
        Event event = new Event("会议",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        event.setId(50L);
        event.setAllDay(false);

        Event saved = repository.save(event);

        verify(eventMapper).updateById(any(EventPO.class));
        verify(eventMapper, never()).insert((EventPO) any(EventPO.class));
        verify(eventTagMapper).deleteByEventId(50L);
        assertThat(saved.getId()).isEqualTo(50L);
    }

    @Test
    @DisplayName("save：空 tagIds 仅删除现有关联，不插入新关联")
    void save_emptyTagIds_deletesButNotInserts() {
        Event event = new Event("会议",
            LocalDateTime.of(2026, 5, 9, 10, 0),
            LocalDateTime.of(2026, 5, 9, 11, 0));
        event.setId(50L);

        repository.save(event);

        verify(eventTagMapper).deleteByEventId(50L);
        verify(eventTagMapper, never()).insert((EventTagPO) any(EventTagPO.class));
    }

    @Test
    @DisplayName("delete：应同时清理 event_tag 与 event 主表")
    void delete_shouldCleanupBothTables() {
        repository.delete(7L);

        verify(eventTagMapper).deleteByEventId(7L);
        verify(eventMapper).deleteById(7L);
    }

    @Test
    @DisplayName("findByRangeAndCategory：应使用分类过滤的 mapper 方法")
    void findByRangeAndCategory_usesCategoryFilter() {
        when(eventMapper.selectByRangeAndCategory(any(), any(), eq(3L)))
            .thenReturn(List.of(sampleEventPO(1L, 0)));

        List<Event> events = repository.findByRangeAndCategory(
            LocalDateTime.of(2026, 5, 1, 0, 0),
            LocalDateTime.of(2026, 5, 31, 23, 59),
            3L);

        assertThat(events).hasSize(1);
        verify(eventMapper).selectByRangeAndCategory(any(), any(), eq(3L));
        verify(eventMapper, never()).selectByRange(any(), any());
    }

    private static EventPO sampleEventPO(Long id, Integer allDay) {
        EventPO po = new EventPO();
        po.setId(id);
        po.setTitle("Demo");
        po.setDescription("desc");
        po.setStartTime(LocalDateTime.of(2026, 5, 9, 10, 0));
        po.setEndTime(LocalDateTime.of(2026, 5, 9, 11, 0));
        po.setAllDay(allDay);
        po.setLocation("Room");
        po.setColor("#1890ff");
        po.setReminderMinutes(15);
        po.setCategoryId(7L);
        po.setCreatedAt(LocalDateTime.of(2026, 5, 1, 0, 0));
        po.setUpdatedAt(LocalDateTime.of(2026, 5, 2, 0, 0));
        return po;
    }
}
