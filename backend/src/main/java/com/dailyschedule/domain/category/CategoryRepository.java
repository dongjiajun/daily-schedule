package com.dailyschedule.domain.category;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository {
    List<Category> findAll();
    Optional<Category> findById(Long id);
    Category save(Category category);
    void delete(Long id);
    boolean existsByName(String name);
}
