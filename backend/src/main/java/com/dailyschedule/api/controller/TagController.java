package com.dailyschedule.api.controller;

import com.dailyschedule.api.generated.api.TagsApi;
import com.dailyschedule.api.generated.dto.TagCreateRequest;
import com.dailyschedule.api.generated.dto.TagListResponse;
import com.dailyschedule.api.generated.dto.TagResponse;
import com.dailyschedule.application.tag.TagApplicationService;
import com.dailyschedule.domain.tag.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class TagController implements TagsApi {

    private final TagApplicationService tagAppService;

    public TagController(TagApplicationService tagAppService) {
        this.tagAppService = tagAppService;
    }

    @Override
    public TagListResponse listTags() {
        List<Tag> tags = tagAppService.listAll();
        TagListResponse resp = new TagListResponse();
        resp.setCode(200);
        resp.setMessage("success");
        resp.setData(tags.stream().map(this::toResponse).collect(Collectors.toList()));
        return resp;
    }

    @Override
    @ResponseStatus(HttpStatus.CREATED)
    public void createTag(TagCreateRequest request) {
        Tag tag = new Tag(request.getName(), request.getColor());
        tagAppService.create(tag);
    }

    @Override
    public void updateTag(Long id, TagCreateRequest request) {
        Tag data = new Tag(request.getName(), request.getColor());
        tagAppService.update(id, data);
    }

    @Override
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTag(Long id) {
        tagAppService.delete(id);
    }

    private TagResponse toResponse(Tag tag) {
        TagResponse resp = new TagResponse();
        resp.setId(tag.getId());
        resp.setName(tag.getName());
        resp.setColor(tag.getColor());
        return resp;
    }
}
