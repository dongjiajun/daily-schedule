package com.dailyschedule.api.assembler;

import com.dailyschedule.api.generated.dto.TagCreateRequest;
import com.dailyschedule.api.generated.dto.TagResponse;
import com.dailyschedule.domain.tag.Tag;

import java.util.List;
import java.util.stream.Collectors;

public class TagAssembler {

    public static Tag toDomain(TagCreateRequest dto) {
        Tag t = new Tag();
        t.setName(dto.getName());
        t.setColor(dto.getColor());
        return t;
    }

    public static TagResponse toResponse(Tag tag) {
        TagResponse resp = new TagResponse();
        resp.setId(tag.getId());
        resp.setName(tag.getName());
        resp.setColor(tag.getColor());
        return resp;
    }

    public static List<TagResponse> toResponseList(List<Tag> tags) {
        return tags.stream().map(TagAssembler::toResponse).collect(Collectors.toList());
    }
}
