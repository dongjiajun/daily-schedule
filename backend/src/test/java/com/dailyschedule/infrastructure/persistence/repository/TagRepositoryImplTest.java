package com.dailyschedule.infrastructure.persistence.repository;

import com.dailyschedule.domain.tag.Tag;
import com.dailyschedule.infrastructure.persistence.mapper.EventTagMapper;
import com.dailyschedule.infrastructure.persistence.mapper.TagMapper;
import com.dailyschedule.infrastructure.persistence.po.TagPO;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TagRepositoryImplTest {

    @Mock
    private TagMapper tagMapper;

    @Mock
    private EventTagMapper eventTagMapper;

    private TagRepositoryImpl repository;

    @BeforeEach
    void setUp() {
        repository = new TagRepositoryImpl(tagMapper, eventTagMapper);
    }

    @Test
    @DisplayName("findAll: 根据 userId 筛选")
    void findAll_filtersByUserId() {
        when(tagMapper.selectList(any())).thenReturn(List.of(samplePO(1L, "重要")));

        List<Tag> tags = repository.findAll(1L);

        assertThat(tags).hasSize(1);
        assertThat(tags.get(0).getName()).isEqualTo("重要");
        assertThat(tags.get(0).getUserId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("findById: 未找到时返回 Optional.empty()")
    void findById_notFound_returnsEmpty() {
        when(tagMapper.selectById(99L)).thenReturn(null);

        Optional<Tag> result = repository.findById(99L);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findById: 找到时返回 Tag")
    void findById_found_returnsTag() {
        when(tagMapper.selectById(1L)).thenReturn(samplePO(1L, "重要"));

        Optional<Tag> result = repository.findById(1L);

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("重要");
    }

    @Test
    @DisplayName("save (insert): 新标签调用 insert，回填 id")
    void save_newTag_callsInsert() {
        Tag tag = new Tag("新标签", "#fff");
        tag.setUserId(1L);

        doAnswer(inv -> {
            TagPO po = inv.getArgument(0);
            po.setId(100L);
            po.setCreatedAt(LocalDateTime.of(2026, 7, 1, 8, 0));
            po.setUpdatedAt(LocalDateTime.of(2026, 7, 1, 8, 0));
            return 1;
        }).when(tagMapper).insert(any(TagPO.class));

        Tag saved = repository.save(tag);

        ArgumentCaptor<TagPO> captor = ArgumentCaptor.forClass(TagPO.class);
        verify(tagMapper).insert(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("新标签");
        assertThat(captor.getValue().getUserId()).isEqualTo(1L);
        assertThat(saved.getId()).isEqualTo(100L);
    }

    @Test
    @DisplayName("save (update): 已有 id 调用 updateById")
    void save_existingTag_callsUpdateById() {
        Tag tag = new Tag("已更新", "#000");
        tag.setId(50L);

        repository.save(tag);

        verify(tagMapper).updateById(any(TagPO.class));
        verify(tagMapper, never()).insert(any(TagPO.class));
    }

    @Test
    @DisplayName("delete: 调用 deleteById")
    void delete_callsMapper() {
        repository.delete(7L);

        verify(tagMapper).deleteById(7L);
    }

    @Test
    @DisplayName("findByEventId: 通过 event_tag 查询标签")
    void findByEventId_returnsTags() {
        when(eventTagMapper.selectTagIdsByEventId(1L)).thenReturn(List.of(10L, 20L));
        when(tagMapper.selectBatchIds(List.of(10L, 20L))).thenReturn(List.of(
            samplePO(10L, "紧急"),
            samplePO(20L, "工作")
        ));

        List<Tag> tags = repository.findByEventId(1L);

        assertThat(tags).hasSize(2);
        assertThat(tags).extracting(Tag::getName)
            .containsExactlyInAnyOrder("紧急", "工作");
    }

    @Test
    @DisplayName("findByEventId: 无关联时返回空列表")
    void findByEventId_noTags_returnsEmpty() {
        when(eventTagMapper.selectTagIdsByEventId(1L)).thenReturn(List.of());

        List<Tag> tags = repository.findByEventId(1L);

        assertThat(tags).isEmpty();
        verify(tagMapper, never()).selectBatchIds(any());
    }

    @Test
    @DisplayName("existsByName: 名称存在返回 true")
    void existsByName_returnsTrue() {
        when(tagMapper.selectCount(any())).thenReturn(1L);

        boolean exists = repository.existsByName("重要", 1L);

        assertThat(exists).isTrue();
    }

    private static TagPO samplePO(Long id, String name) {
        TagPO po = new TagPO();
        po.setId(id);
        po.setName(name);
        po.setColor("#1890ff");
        po.setUserId(1L);
        po.setCreatedAt(LocalDateTime.of(2026, 7, 1, 0, 0));
        po.setUpdatedAt(LocalDateTime.of(2026, 7, 1, 0, 0));
        return po;
    }
}
