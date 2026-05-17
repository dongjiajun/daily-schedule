package com.dailyschedule.application.category;

import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.domain.category.Category;
import com.dailyschedule.domain.category.CategoryRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryApplicationService {

    private final CategoryRepository categoryRepository;

    public CategoryApplicationService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<Category> listAll(Long userId) {
        return categoryRepository.findAll(userId);
    }

    public Category getById(Long id) {
        return categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("分类不存在: " + id));
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public Category create(Category category) {
        if (!category.isValid()) {
            throw new IllegalArgumentException("分类名称不能为空");
        }
        if (categoryRepository.existsByName(category.getName())) {
            throw new IllegalArgumentException("分类名称已存在: " + category.getName());
        }
        return categoryRepository.save(category);
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public Category update(Long id, Category data) {
        Category existing = getById(id);
        if (data.getName() != null && !data.getName().equals(existing.getName())) {
            if (categoryRepository.existsByNameExcludingId(data.getName(), id)) {
                throw new IllegalArgumentException("分类名称已存在: " + data.getName());
            }
            existing.setName(data.getName());
        }
        if (data.getColor() != null) existing.setColor(data.getColor());
        if (data.getDescription() != null) existing.setDescription(data.getDescription());
        return categoryRepository.save(existing);
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public void delete(Long id) {
        getById(id);
        categoryRepository.delete(id);
    }
}
