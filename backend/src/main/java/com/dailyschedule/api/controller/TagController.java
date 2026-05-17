package com.dailyschedule.api.controller;

import com.dailyschedule.api.assembler.TagAssembler;
import com.dailyschedule.api.generated.api.TagsApi;
import com.dailyschedule.api.generated.dto.TagCreateRequest;
import com.dailyschedule.api.generated.dto.TagResponse;
import com.dailyschedule.application.tag.TagApplicationService;
import com.dailyschedule.domain.tag.Tag;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Validated
public class TagController implements TagsApi {

    private final TagApplicationService tagAppService;
    private final CurrentUserService currentUserService;

    public TagController(TagApplicationService tagAppService, CurrentUserService currentUserService) {
        this.tagAppService = tagAppService;
        this.currentUserService = currentUserService;
    }

    @Override
    public List<TagResponse> listTags() {
        List<Tag> tags = tagAppService.listAll(currentUserService.getCurrentUserId());
        return TagAssembler.toResponseList(tags);
    }

    @Override
    @ResponseStatus(HttpStatus.CREATED)
    public TagResponse createTag(TagCreateRequest request) {
        Tag tag = TagAssembler.toDomain(request);
        Tag saved = tagAppService.create(tag);
        return TagAssembler.toResponse(saved);
    }

    @Override
    public TagResponse updateTag(Long id, TagCreateRequest request) {
        Tag data = TagAssembler.toDomain(request);
        Tag updated = tagAppService.update(id, data);
        return TagAssembler.toResponse(updated);
    }

    @Override
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTag(Long id) {
        tagAppService.delete(id);
    }
}
