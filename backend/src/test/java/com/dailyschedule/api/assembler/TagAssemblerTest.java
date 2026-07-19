package com.dailyschedule.api.assembler;

import com.dailyschedule.api.generated.dto.TagCreateRequest;
import com.dailyschedule.api.generated.dto.TagResponse;
import com.dailyschedule.domain.tag.Tag;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TagAssemblerTest {

    @Test
    @DisplayName("toDomain: name 与 color 映射")
    void toDomain_mapsAllFields() {
        TagCreateRequest dto = new TagCreateRequest();
        dto.setName("重要");
        dto.setColor("#ff0000");

        Tag tag = TagAssembler.toDomain(dto);

        assertThat(tag.getName()).isEqualTo("重要");
        assertThat(tag.getColor()).isEqualTo("#ff0000");
    }

    @Test
    @DisplayName("toDomain: color 为 null 时不抛异常")
    void toDomain_nullColor_keepsNull() {
        TagCreateRequest dto = new TagCreateRequest();
        dto.setName("无颜色");

        Tag tag = TagAssembler.toDomain(dto);

        assertThat(tag.getName()).isEqualTo("无颜色");
        assertThat(tag.getColor()).isNull();
    }

    @Test
    @DisplayName("toResponse: 完整字段映射")
    void toResponse_mapsAllFields() {
        Tag tag = new Tag("工作", "#1890ff");
        tag.setId(1L);

        TagResponse resp = TagAssembler.toResponse(tag);

        assertThat(resp.getId()).isEqualTo(1L);
        assertThat(resp.getName()).isEqualTo("工作");
        assertThat(resp.getColor()).isEqualTo("#1890ff");
    }

    @Test
    @DisplayName("toResponseList: 批量映射保持顺序")
    void toResponseList_preservesOrder() {
        Tag a = new Tag("A", "#111"); a.setId(1L);
        Tag b = new Tag("B", "#222"); b.setId(2L);

        List<TagResponse> list = TagAssembler.toResponseList(List.of(a, b));

        assertThat(list).hasSize(2);
        assertThat(list.get(0).getName()).isEqualTo("A");
        assertThat(list.get(1).getName()).isEqualTo("B");
    }

    @Test
    @DisplayName("toResponseList: 空列表返回空列表")
    void toResponseList_empty_returnsEmpty() {
        List<TagResponse> list = TagAssembler.toResponseList(List.of());
        assertThat(list).isEmpty();
    }
}
