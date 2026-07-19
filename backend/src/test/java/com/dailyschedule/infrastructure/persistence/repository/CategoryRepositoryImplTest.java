package com.dailyschedule.infrastructure.persistence.repository;

import com.dailyschedule.domain.category.Category;
import com.dailyschedule.infrastructure.persistence.mapper.CategoryMapper;
import com.dailyschedule.infrastructure.persistence.po.CategoryPO;
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
class CategoryRepositoryImplTest {

    @Mock
    private CategoryMapper categoryMapper;

    private CategoryRepositoryImpl repository;

    @BeforeEach
    void setUp() {
        repository = new CategoryRepositoryImpl(categoryMapper);
    }

    @Test
    @DisplayName("findAll: 根据 userId 筛选并转换为 Domain")
    void findAll_filtersByUserId() {
        when(categoryMapper.selectList(any())).thenReturn(List.of(samplePO(1L, "工作")));

        List<Category> categories = repository.findAll(1L);

        assertThat(categories).hasSize(1);
        assertThat(categories.get(0).getName()).isEqualTo("工作");
        assertThat(categories.get(0).getUserId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("findById: 未找到时返回 Optional.empty()")
    void findById_notFound_returnsEmpty() {
        when(categoryMapper.selectById(99L)).thenReturn(null);

        Optional<Category> result = repository.findById(99L);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findById: 找到时返回 Category")
    void findById_found_returnsCategory() {
        when(categoryMapper.selectById(1L)).thenReturn(samplePO(1L, "工作"));

        Optional<Category> result = repository.findById(1L);

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("工作");
    }

    @Test
    @DisplayName("save (insert): 新分类调用 insert，回填 id")
    void save_newCategory_callsInsert() {
        Category category = new Category("新分类", "#fff");
        category.setUserId(1L);

        doAnswer(inv -> {
            CategoryPO po = inv.getArgument(0);
            po.setId(100L);
            po.setCreatedAt(LocalDateTime.of(2026, 7, 1, 8, 0));
            po.setUpdatedAt(LocalDateTime.of(2026, 7, 1, 8, 0));
            return 1;
        }).when(categoryMapper).insert(any(CategoryPO.class));

        Category saved = repository.save(category);

        ArgumentCaptor<CategoryPO> captor = ArgumentCaptor.forClass(CategoryPO.class);
        verify(categoryMapper).insert(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("新分类");
        assertThat(captor.getValue().getUserId()).isEqualTo(1L);
        assertThat(saved.getId()).isEqualTo(100L);
    }

    @Test
    @DisplayName("save (update): 已有 id 调用 updateById")
    void save_existingCategory_callsUpdateById() {
        Category category = new Category("已更新", "#000");
        category.setId(50L);

        repository.save(category);

        verify(categoryMapper).updateById(any(CategoryPO.class));
        verify(categoryMapper, never()).insert(any(CategoryPO.class));
    }

    @Test
    @DisplayName("delete: 调用 deleteById")
    void delete_callsMapper() {
        repository.delete(7L);

        verify(categoryMapper).deleteById(7L);
    }

    @Test
    @DisplayName("existsByName: 名称存在返回 true")
    void existsByName_returnsTrue() {
        when(categoryMapper.selectCount(any())).thenReturn(1L);

        boolean exists = repository.existsByName("工作", 1L);

        assertThat(exists).isTrue();
    }

    private static CategoryPO samplePO(Long id, String name) {
        CategoryPO po = new CategoryPO();
        po.setId(id);
        po.setName(name);
        po.setColor("#1890ff");
        po.setDescription("desc");
        po.setUserId(1L);
        po.setCreatedAt(LocalDateTime.of(2026, 7, 1, 0, 0));
        po.setUpdatedAt(LocalDateTime.of(2026, 7, 1, 0, 0));
        return po;
    }
}
