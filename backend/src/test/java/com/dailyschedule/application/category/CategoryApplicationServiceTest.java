package com.dailyschedule.application.category;

import com.dailyschedule.domain.category.Category;
import com.dailyschedule.domain.category.CategoryRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryApplicationServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    private CategoryApplicationService appService;

    @BeforeEach
    void setUp() {
        appService = new CategoryApplicationService(categoryRepository);
    }

    @Test
    @DisplayName("listAll → 返回所有分类")
    void listAll_shouldReturnAll() {
        when(categoryRepository.findAll()).thenReturn(List.of(
            new Category("工作", "#1890ff"),
            new Category("生活", "#52c41a")
        ));

        List<Category> list = appService.listAll();
        assertThat(list).hasSize(2);
        verify(categoryRepository).findAll();
    }

    @Test
    @DisplayName("getById → 不存在抛出 RuntimeException")
    void getById_notFound_shouldThrow() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appService.getById(99L))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("分类不存在");
    }

    @Test
    @DisplayName("create → 名称为空抛出 IllegalArgumentException")
    void create_blankName_shouldThrow() {
        Category bad = new Category("", "#000");

        assertThatThrownBy(() -> appService.create(bad))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("名称不能为空");
        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("create → 名称已存在抛出 IllegalArgumentException")
    void create_duplicateName_shouldThrow() {
        Category dup = new Category("工作", "#1890ff");
        when(categoryRepository.existsByName("工作")).thenReturn(true);

        assertThatThrownBy(() -> appService.create(dup))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("已存在");
        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("create → 合法分类应保存并返回")
    void create_validCategory_shouldSave() {
        Category category = new Category("健身", "#fa541c");
        when(categoryRepository.existsByName("健身")).thenReturn(false);
        when(categoryRepository.save(any())).thenAnswer(inv -> {
            Category c = inv.getArgument(0);
            c.setId(10L);
            return c;
        });

        Category saved = appService.create(category);
        assertThat(saved.getId()).isEqualTo(10L);
        assertThat(saved.getName()).isEqualTo("健身");
    }

    @Test
    @DisplayName("update → 仅更新非 null 字段")
    void update_partialFields_shouldMergeOnlyNonNull() {
        Category existing = new Category("工作", "#1890ff");
        existing.setId(1L);
        existing.setDescription("原描述");
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Category patch = new Category();
        patch.setColor("#000000");

        Category updated = appService.update(1L, patch);
        assertThat(updated.getName()).isEqualTo("工作");
        assertThat(updated.getColor()).isEqualTo("#000000");
        assertThat(updated.getDescription()).isEqualTo("原描述");
    }

    @Test
    @DisplayName("update → 不存在的 ID 抛异常且不调用 save")
    void update_notFound_shouldThrow() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appService.update(99L, new Category("x", "#000")))
            .isInstanceOf(RuntimeException.class);
        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("delete → 存在时删除")
    void delete_existing_shouldCallDelete() {
        Category c = new Category("工作", "#000");
        c.setId(1L);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(c));

        appService.delete(1L);
        verify(categoryRepository).delete(1L);
    }

    @Test
    @DisplayName("delete → 不存在的 ID 抛异常且不调用 delete")
    void delete_notFound_shouldThrow() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appService.delete(99L))
            .isInstanceOf(RuntimeException.class);
        verify(categoryRepository, never()).delete(any());
    }
}
