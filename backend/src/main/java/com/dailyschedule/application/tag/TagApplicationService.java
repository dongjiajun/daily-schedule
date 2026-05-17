package com.dailyschedule.application.tag;

import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.domain.tag.Tag;
import com.dailyschedule.domain.tag.TagRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TagApplicationService {

    private final TagRepository tagRepository;

    public TagApplicationService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    public List<Tag> listAll(Long userId) {
        return tagRepository.findAll(userId);
    }

    public Tag getById(Long id) {
        return tagRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("标签不存在: " + id));
    }

    @Transactional
    @CacheEvict(value = "tags", allEntries = true)
    public Tag create(Tag tag) {
        if (!tag.isValid()) {
            throw new IllegalArgumentException("标签名称不能为空");
        }
        if (tagRepository.existsByName(tag.getName())) {
            throw new IllegalArgumentException("标签名称已存在: " + tag.getName());
        }
        return tagRepository.save(tag);
    }

    @Transactional
    @CacheEvict(value = "tags", allEntries = true)
    public Tag update(Long id, Tag data) {
        Tag existing = getById(id);
        if (data.getName() != null && !data.getName().equals(existing.getName())) {
            if (tagRepository.existsByNameExcludingId(data.getName(), id)) {
                throw new IllegalArgumentException("标签名称已存在: " + data.getName());
            }
            existing.setName(data.getName());
        }
        if (data.getColor() != null) existing.setColor(data.getColor());
        return tagRepository.save(existing);
    }

    @Transactional
    @CacheEvict(value = "tags", allEntries = true)
    public void delete(Long id) {
        getById(id);
        tagRepository.delete(id);
    }
}
