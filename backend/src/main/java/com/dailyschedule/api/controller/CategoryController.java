package com.dailyschedule.api.controller;

import com.dailyschedule.api.assembler.CategoryAssembler;
import com.dailyschedule.api.generated.api.CategoriesApi;
import com.dailyschedule.api.generated.dto.CategoryCreateRequest;
import com.dailyschedule.api.generated.dto.CategoryListResponse;
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
    public CategoryListResponse listCategories() {
        List<Category> categories = categoryAppService.listAll();
        CategoryListResponse resp = new CategoryListResponse();
        resp.setCode(200);
        resp.setMessage("success");
        resp.setData(CategoryAssembler.toResponseList(categories));
        return resp;
    }

    @Override
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse createCategory(CategoryCreateRequest request) {
        Category category = CategoryAssembler.toDomain(request);
        Category saved = categoryAppService.create(category);
        return CategoryAssembler.toResponse(saved);
    }

    @Override
    public void updateCategory(Long id, CategoryCreateRequest request) {
        Category data = CategoryAssembler.toDomain(request);
        categoryAppService.update(id, data);
    }

    @Override
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(Long id) {
        categoryAppService.delete(id);
    }
}
