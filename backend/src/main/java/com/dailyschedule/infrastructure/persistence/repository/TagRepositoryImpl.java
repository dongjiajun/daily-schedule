package com.dailyschedule.infrastructure.persistence.repository;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dailyschedule.domain.tag.Tag;
import com.dailyschedule.domain.tag.TagRepository;
import com.dailyschedule.infrastructure.persistence.mapper.EventTagMapper;
import com.dailyschedule.infrastructure.persistence.mapper.TagMapper;
import com.dailyschedule.infrastructure.persistence.po.TagPO;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class TagRepositoryImpl implements TagRepository {

    private final TagMapper tagMapper;
    private final EventTagMapper eventTagMapper;

    public TagRepositoryImpl(TagMapper tagMapper, EventTagMapper eventTagMapper) {
        this.tagMapper = tagMapper;
        this.eventTagMapper = eventTagMapper;
    }

    @Override
    public List<Tag> findAll() {
        return tagMapper.selectList(null).stream()
            .map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public Optional<Tag> findById(Long id) {
        TagPO po = tagMapper.selectById(id);
        return po == null ? Optional.empty() : Optional.of(toDomain(po));
    }

    @Override
    public Tag save(Tag tag) {
        TagPO po = toPO(tag);
        if (tag.getId() == null) {
            tagMapper.insert(po);
            tag.setId(po.getId());
            tag.setCreatedAt(po.getCreatedAt());
            tag.setUpdatedAt(po.getUpdatedAt());
        } else {
            tagMapper.updateById(po);
        }
        return tag;
    }

    @Override
    public void delete(Long id) {
        tagMapper.deleteById(id);
    }

    @Override
    public List<Tag> findByEventId(Long eventId) {
        List<Long> tagIds = eventTagMapper.selectTagIdsByEventId(eventId);
        if (tagIds.isEmpty()) return List.of();
        return tagMapper.selectBatchIds(tagIds).stream()
            .map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public boolean existsByName(String name) {
        LambdaQueryWrapper<TagPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TagPO::getName, name);
        return tagMapper.selectCount(wrapper) > 0;
    }

    @Override
    public boolean existsByNameExcludingId(String name, Long excludeId) {
        LambdaQueryWrapper<TagPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TagPO::getName, name).ne(TagPO::getId, excludeId);
        return tagMapper.selectCount(wrapper) > 0;
    }

    private Tag toDomain(TagPO po) {
        Tag t = new Tag();
        t.setId(po.getId());
        t.setName(po.getName());
        t.setColor(po.getColor());
        t.setCreatedAt(po.getCreatedAt());
        t.setUpdatedAt(po.getUpdatedAt());
        return t;
    }

    private TagPO toPO(Tag tag) {
        TagPO po = new TagPO();
        po.setId(tag.getId());
        po.setName(tag.getName());
        po.setColor(tag.getColor());
        return po;
    }
}
