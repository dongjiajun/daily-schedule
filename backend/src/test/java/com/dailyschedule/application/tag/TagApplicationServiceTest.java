package com.dailyschedule.application.tag;

import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.domain.tag.Tag;
import com.dailyschedule.domain.tag.TagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TagApplicationServiceTest {

    @Mock
    private TagRepository tagRepository;

    private TagApplicationService appService;

    @BeforeEach
    void setUp() {
        appService = new TagApplicationService(tagRepository);
    }

    @Test
    @DisplayName("listAll → 返回所有标签")
    void listAll_shouldReturnAll() {
        when(tagRepository.findAll(anyLong())).thenReturn(List.of(
            new Tag("紧急", "#ff4d4f"),
            new Tag("重要", "#faad14")
        ));

        List<Tag> list = appService.listAll(1L);
        assertThat(list).hasSize(2);
    }

    @Test
    @DisplayName("getById → 不存在抛出 ResourceNotFoundException")
    void getById_notFound_shouldThrow() {
        when(tagRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appService.getById(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("标签不存在");
    }

    @Test
    @DisplayName("create → 名称为空抛出 IllegalArgumentException")
    void create_blankName_shouldThrow() {
        Tag bad = new Tag("   ", "#000");

        assertThatThrownBy(() -> appService.create(bad))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("名称不能为空");
        verify(tagRepository, never()).save(any());
    }

    @Test
    @DisplayName("create → 合法标签应保存并返回")
    void create_validTag_shouldSave() {
        Tag tag = new Tag("紧急", "#ff4d4f");
        when(tagRepository.save(any())).thenAnswer(inv -> {
            Tag t = inv.getArgument(0);
            t.setId(7L);
            return t;
        });

        Tag saved = appService.create(tag);
        assertThat(saved.getId()).isEqualTo(7L);
        assertThat(saved.getName()).isEqualTo("紧急");
    }

    @Test
    @DisplayName("update → 仅更新非 null 字段")
    void update_partialFields_shouldMergeOnlyNonNull() {
        Tag existing = new Tag("紧急", "#ff0000");
        existing.setId(1L);
        when(tagRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(tagRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Tag patch = new Tag();
        patch.setName("非常紧急");

        Tag updated = appService.update(1L, patch);
        assertThat(updated.getName()).isEqualTo("非常紧急");
        assertThat(updated.getColor()).isEqualTo("#ff0000");
    }

    @Test
    @DisplayName("update → 不存在的 ID 抛异常且不调用 save")
    void update_notFound_shouldThrow() {
        when(tagRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appService.update(99L, new Tag("x", "#000")))
            .isInstanceOf(ResourceNotFoundException.class);
        verify(tagRepository, never()).save(any());
    }

    @Test
    @DisplayName("delete → 存在时删除")
    void delete_existing_shouldCallDelete() {
        Tag t = new Tag("紧急", "#000");
        t.setId(1L);
        when(tagRepository.findById(1L)).thenReturn(Optional.of(t));

        appService.delete(1L);
        verify(tagRepository).delete(1L);
    }

    @Test
    @DisplayName("delete → 不存在的 ID 抛异常且不调用 delete")
    void delete_notFound_shouldThrow() {
        when(tagRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appService.delete(99L))
            .isInstanceOf(ResourceNotFoundException.class);
        verify(tagRepository, never()).delete(any());
    }
}
