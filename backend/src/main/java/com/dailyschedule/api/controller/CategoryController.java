package com.dailyschedule.api.controller;

import com.dailyschedule.api.assembler.CategoryAssembler;
import com.dailyschedule.api.generated.api.CategoriesApi;
import com.dailyschedule.api.generated.dto.CategoryCreateRequest;
import com.dailyschedule.api.generated.dto.CategoryResponse;
import com.dailyschedule.application.category.CategoryApplicationService;
import com.dailyschedule.domain.category.Category;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Validated
public class CategoryController implements CategoriesApi {

    private static final Logger log = LoggerFactory.getLogger(CategoryController.class);

    private final CategoryApplicationService categoryAppService;
    private final CurrentUserService currentUserService;

    public CategoryController(CategoryApplicationService categoryAppService, CurrentUserService currentUserService) {
        this.categoryAppService = categoryAppService;
        this.currentUserService = currentUserService;
    }

    @Override
    public List<CategoryResponse> listCategories() {
        Long userId = currentUserService.getCurrentUserId();
        log.info("listCategories: userId={}", userId);
        List<Category> categories = categoryAppService.listAll(userId);
        return CategoryAssembler.toResponseList(categories);
    }

    @Override
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse createCategory(@Valid @RequestBody CategoryCreateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        log.info("createCategory: userId={} name={}", userId, request.getName());
        Category category = CategoryAssembler.toDomain(request);
        category.setUserId(userId);
        Category saved = categoryAppService.create(category);
        return CategoryAssembler.toResponse(saved);
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryCreateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        log.info("updateCategory: userId={} id={}", userId, id);
        Category data = CategoryAssembler.toDomain(request);
        Category updated = categoryAppService.update(id, data, userId);
        return CategoryAssembler.toResponse(updated);
    }

    @Override
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(Long id) {
        Long userId = currentUserService.getCurrentUserId();
        log.info("deleteCategory: userId={} id={}", userId, id);
        categoryAppService.delete(id, userId);
    }
}
