package com.dailyschedule.api.assembler;

import com.dailyschedule.api.generated.dto.CategoryCreateRequest;
import com.dailyschedule.api.generated.dto.CategoryResponse;
import com.dailyschedule.domain.category.Category;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CategoryAssemblerTest {

    @Test
    @DisplayName("toDomain: name, color, description 全部映射")
    void toDomain_mapsAllFields() {
        CategoryCreateRequest dto = new CategoryCreateRequest();
        dto.setName("工作");
        dto.setColor("#1890ff");
        dto.setDescription("工作相关日程");

        Category c = CategoryAssembler.toDomain(dto);

        assertThat(c.getName()).isEqualTo("工作");
        assertThat(c.getColor()).isEqualTo("#1890ff");
        assertThat(c.getDescription()).isEqualTo("工作相关日程");
    }

    @Test
    @DisplayName("toDomain: 可选字段为 null 时不抛异常")
    void toDomain_nullableFields_null() {
        CategoryCreateRequest dto = new CategoryCreateRequest();
        dto.setName("无描述");

        Category c = CategoryAssembler.toDomain(dto);

        assertThat(c.getName()).isEqualTo("无描述");
        assertThat(c.getColor()).isNull();
        assertThat(c.getDescription()).isNull();
    }

    @Test
    @DisplayName("toResponse: 完整字段映射")
    void toResponse_mapsAllFields() {
        Category c = new Category("个人", "#10b981");
        c.setId(2L);
        c.setDescription("个人事务");

        CategoryResponse resp = CategoryAssembler.toResponse(c);

        assertThat(resp.getId()).isEqualTo(2L);
        assertThat(resp.getName()).isEqualTo("个人");
        assertThat(resp.getColor()).isEqualTo("#10b981");
        assertThat(resp.getDescription()).isEqualTo("个人事务");
    }

    @Test
    @DisplayName("toResponse: description 为 null 时响应字段为 null")
    void toResponse_nullDescription() {
        Category c = new Category("测试", "#000");
        c.setId(3L);

        CategoryResponse resp = CategoryAssembler.toResponse(c);

        assertThat(resp.getDescription()).isNull();
    }

    @Test
    @DisplayName("toResponseList: 批量映射保持顺序")
    void toResponseList_preservesOrder() {
        Category a = new Category("A", "#111"); a.setId(1L);
        Category b = new Category("B", "#222"); b.setId(2L);

        List<CategoryResponse> list = CategoryAssembler.toResponseList(List.of(a, b));

        assertThat(list).hasSize(2);
        assertThat(list.get(0).getName()).isEqualTo("A");
        assertThat(list.get(1).getName()).isEqualTo("B");
    }
}
