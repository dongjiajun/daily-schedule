package com.dailyschedule.api.assembler;

import com.dailyschedule.api.generated.dto.CategoryCreateRequest;
import com.dailyschedule.api.generated.dto.CategoryResponse;
import com.dailyschedule.domain.category.Category;

import java.util.List;
import java.util.stream.Collectors;

public class CategoryAssembler {

    public static Category toDomain(CategoryCreateRequest dto) {
        Category c = new Category();
        c.setName(dto.getName());
        c.setColor(dto.getColor());
        c.setDescription(dto.getDescription());
        return c;
    }

    public static CategoryResponse toResponse(Category category) {
        CategoryResponse resp = new CategoryResponse();
        resp.setId(category.getId());
        resp.setName(category.getName());
        resp.setColor(category.getColor());
        resp.setDescription(category.getDescription());
        return resp;
    }

    public static List<CategoryResponse> toResponseList(List<Category> categories) {
        return categories.stream().map(CategoryAssembler::toResponse).collect(Collectors.toList());
    }
}
