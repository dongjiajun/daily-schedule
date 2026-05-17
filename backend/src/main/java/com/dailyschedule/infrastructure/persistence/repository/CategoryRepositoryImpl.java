package com.dailyschedule.infrastructure.persistence.repository;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dailyschedule.domain.category.Category;
import com.dailyschedule.domain.category.CategoryRepository;
import com.dailyschedule.infrastructure.persistence.mapper.CategoryMapper;
import com.dailyschedule.infrastructure.persistence.po.CategoryPO;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class CategoryRepositoryImpl implements CategoryRepository {

    private final CategoryMapper categoryMapper;

    public CategoryRepositoryImpl(CategoryMapper categoryMapper) {
        this.categoryMapper = categoryMapper;
    }

    @Override
    public List<Category> findAll(Long userId) {
        LambdaQueryWrapper<CategoryPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CategoryPO::getUserId, userId);
        return categoryMapper.selectList(wrapper).stream()
            .map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public Optional<Category> findById(Long id) {
        CategoryPO po = categoryMapper.selectById(id);
        return po == null ? Optional.empty() : Optional.of(toDomain(po));
    }

    @Override
    public Category save(Category category) {
        CategoryPO po = toPO(category);
        if (category.getId() == null) {
            categoryMapper.insert(po);
            category.setId(po.getId());
            category.setCreatedAt(po.getCreatedAt());
            category.setUpdatedAt(po.getUpdatedAt());
        } else {
            categoryMapper.updateById(po);
        }
        return category;
    }

    @Override
    public void delete(Long id) {
        categoryMapper.deleteById(id);
    }

    @Override
    public boolean existsByName(String name) {
        LambdaQueryWrapper<CategoryPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CategoryPO::getName, name);
        return categoryMapper.selectCount(wrapper) > 0;
    }

    @Override
    public boolean existsByNameExcludingId(String name, Long excludeId) {
        LambdaQueryWrapper<CategoryPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CategoryPO::getName, name).ne(CategoryPO::getId, excludeId);
        return categoryMapper.selectCount(wrapper) > 0;
    }

    private Category toDomain(CategoryPO po) {
        Category c = new Category();
        c.setId(po.getId());
        c.setName(po.getName());
        c.setColor(po.getColor());
        c.setDescription(po.getDescription());
        c.setUserId(po.getUserId());
        c.setCreatedAt(po.getCreatedAt());
        c.setUpdatedAt(po.getUpdatedAt());
        return c;
    }

    private CategoryPO toPO(Category category) {
        CategoryPO po = new CategoryPO();
        po.setId(category.getId());
        po.setName(category.getName());
        po.setColor(category.getColor());
        po.setDescription(category.getDescription());
        po.setUserId(category.getUserId());
        return po;
    }
}
