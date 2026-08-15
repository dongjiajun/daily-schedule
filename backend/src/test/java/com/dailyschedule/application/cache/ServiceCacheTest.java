package com.dailyschedule.application.cache;

import com.dailyschedule.application.category.CategoryApplicationService;
import com.dailyschedule.application.tag.TagApplicationService;
import com.dailyschedule.domain.category.Category;
import com.dailyschedule.domain.category.CategoryRepository;
import com.dailyschedule.domain.tag.Tag;
import com.dailyschedule.domain.tag.TagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 服务层缓存行为验证（service-caching spec）。
 * 覆盖 Caffeine 开启：首次写缓存/再次命中、create/update/delete 三路径精确失效、按 userId 隔离与不跨用户失效。
 * 默认测试配置（application-test.yml）为 type=none，此处显式覆盖回 caffeine 验证真实缓存行为。
 */
@SpringBootTest
@TestPropertySource(properties = {
    "spring.cache.type=caffeine",
    "spring.cache.caffeine.spec=maximumSize=100,expireAfterWrite=5m"
})
class ServiceCacheTest {

    @Autowired
    private CategoryApplicationService categoryService;

    @Autowired
    private TagApplicationService tagService;

    @MockitoBean
    private CategoryRepository categoryRepository;

    @MockitoBean
    private TagRepository tagRepository;

    @Autowired
    private CacheManager cacheManager;

    @BeforeEach
    void clearCaches() {
        // 共享 Spring 上下文下 Caffeine 条目跨测试残留 → 每测试前清空，保证断言独立
        cacheManager.getCacheNames().forEach(name ->
            Objects.requireNonNull(cacheManager.getCache(name)).clear());
    }

    private Category category(Long id, Long userId) {
        Category c = new Category("工作", "#1890ff");
        c.setId(id);
        c.setUserId(userId);
        return c;
    }

    private Tag tag(Long id, Long userId) {
        Tag t = new Tag("重要", "#ff4d4f");
        t.setId(id);
        t.setUserId(userId);
        return t;
    }

    @Test
    @DisplayName("listAll：首次查询写缓存，再次调用命中缓存不查库")
    void listAll_secondCall_hitsCache() {
        when(categoryRepository.findAll(1L)).thenReturn(List.of(category(1L, 1L)));

        assertThat(categoryService.listAll(1L)).hasSize(1);
        assertThat(categoryService.listAll(1L)).hasSize(1);

        verify(categoryRepository, times(1)).findAll(1L);
    }

    @Test
    @DisplayName("listAll：不同 userId 缓存互相隔离")
    void listAll_differentUsers_isolated() {
        when(categoryRepository.findAll(1L)).thenReturn(List.of(category(1L, 1L)));
        when(categoryRepository.findAll(2L)).thenReturn(List.of(category(2L, 2L)));

        categoryService.listAll(1L);
        categoryService.listAll(1L);
        categoryService.listAll(2L);
        categoryService.listAll(2L);

        verify(categoryRepository, times(1)).findAll(1L);
        verify(categoryRepository, times(1)).findAll(2L);
    }

    @Test
    @DisplayName("create：清空该用户缓存，下次 listAll 重新查库")
    void create_evictsUserCache() {
        Category toCreate = category(null, 1L);
        when(categoryRepository.findAll(1L)).thenReturn(List.of(category(1L, 1L)));
        when(categoryRepository.existsByName("工作", 1L)).thenReturn(false);
        when(categoryRepository.save(toCreate)).thenReturn(category(1L, 1L));

        categoryService.listAll(1L);
        categoryService.create(toCreate);
        categoryService.listAll(1L);

        verify(categoryRepository, times(2)).findAll(1L);
    }

    @Test
    @DisplayName("update：清空该用户缓存，下次 listAll 重新查库")
    void update_evictsUserCache() {
        Category existing = category(1L, 1L);
        Category data = category(1L, 1L);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.save(existing)).thenReturn(existing);
        when(categoryRepository.findAll(1L)).thenReturn(List.of(existing));

        categoryService.listAll(1L);
        categoryService.update(1L, data, 1L);
        categoryService.listAll(1L);

        verify(categoryRepository, times(2)).findAll(1L);
    }

    @Test
    @DisplayName("delete：清空该用户缓存，下次 listAll 重新查库")
    void delete_evictsUserCache() {
        Category existing = category(1L, 1L);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.findAll(1L)).thenReturn(List.of(existing));

        categoryService.listAll(1L);
        categoryService.delete(1L, 1L);
        categoryService.listAll(1L);

        verify(categoryRepository, times(2)).findAll(1L);
    }

    @Test
    @DisplayName("失效不跨用户：用户 2 的写操作不影响用户 1 的缓存")
    void evict_doesNotAffectOtherUsers() {
        Category toCreate = category(null, 2L);
        when(categoryRepository.findAll(1L)).thenReturn(List.of(category(1L, 1L)));
        when(categoryRepository.findAll(2L)).thenReturn(List.of(category(2L, 2L)));
        when(categoryRepository.existsByName("工作", 2L)).thenReturn(false);
        when(categoryRepository.save(toCreate)).thenReturn(category(2L, 2L));

        categoryService.listAll(1L);
        categoryService.listAll(2L);
        categoryService.create(toCreate);
        categoryService.listAll(1L); // 用户 1 仍命中缓存
        categoryService.listAll(2L); // 用户 2 已失效，重新查库

        verify(categoryRepository, times(1)).findAll(1L);
        verify(categoryRepository, times(2)).findAll(2L);
    }

    @Test
    @DisplayName("Tag 同构：listAll 命中缓存 + create 精确失效")
    void tagService_cacheAndEvict() {
        Tag toCreate = tag(null, 1L);
        when(tagRepository.findAll(1L)).thenReturn(List.of(tag(1L, 1L)));
        when(tagRepository.existsByName("重要", 1L)).thenReturn(false);
        when(tagRepository.save(toCreate)).thenReturn(tag(1L, 1L));

        assertThat(tagService.listAll(1L)).hasSize(1);
        assertThat(tagService.listAll(1L)).hasSize(1);
        verify(tagRepository, times(1)).findAll(1L);

        tagService.create(toCreate);
        tagService.listAll(1L);
        verify(tagRepository, times(2)).findAll(1L);
    }

    @Test
    @DisplayName("update 重名校验路径不影响缓存语义（existsByNameExcludingId 走库）")
    void update_renameCheck_goesToRepository() {
        Category existing = category(1L, 1L);
        Category data = category(1L, 1L);
        data.setName("新名字");
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.existsByNameExcludingId("新名字", 1L, 1L)).thenReturn(false);
        when(categoryRepository.save(existing)).thenReturn(existing);
        when(categoryRepository.findAll(1L)).thenReturn(List.of(existing));

        categoryService.listAll(1L);
        categoryService.update(1L, data, 1L);
        categoryService.listAll(1L);

        verify(categoryRepository, times(2)).findAll(1L);
    }
}
