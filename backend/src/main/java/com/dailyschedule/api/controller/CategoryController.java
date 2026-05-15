package com.dailyschedule.api.controller;

import com.dailyschedule.api.assembler.CategoryAssembler;
import com.dailyschedule.api.generated.api.CategoriesApi;
import com.dailyschedule.api.generated.dto.CategoryCreateRequest;
import com.dailyschedule.api.generated.dto.CategoryResponse;
import com.dailyschedule.application.category.CategoryApplicationService;
import com.dailyschedule.domain.category.Category;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class CategoryController implements CategoriesApi {

    private final CategoryApplicationService categoryAppService;

    public CategoryController(CategoryApplicationService categoryAppService) {
        this.categoryAppService = categoryAppService;
    }

    @Override
    public List<CategoryResponse> listCategories() {
        List<Category> categories = categoryAppService.listAll();
        return CategoryAssembler.toResponseList(categories);
    }

    @Override
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse createCategory(CategoryCreateRequest request) {
        Category category = CategoryAssembler.toDomain(request);
        Category saved = categoryAppService.create(category);
        return CategoryAssembler.toResponse(saved);
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryCreateRequest request) {
        Category data = CategoryAssembler.toDomain(request);
        Category updated = categoryAppService.update(id, data);
        return CategoryAssembler.toResponse(updated);
    }

    @Override
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(Long id) {
        categoryAppService.delete(id);
    }
}
