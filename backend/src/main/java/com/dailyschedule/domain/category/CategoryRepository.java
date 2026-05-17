package com.dailyschedule.domain.category;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository {
    List<Category> findAll(Long userId);
    Optional<Category> findById(Long id);
    Category save(Category category);
    void delete(Long id);
    boolean existsByName(String name);

    /** 查询同名分类但排除指定 ID（用于 update 路径的重名校验）。 */
    boolean existsByNameExcludingId(String name, Long excludeId);
}
