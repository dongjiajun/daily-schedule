package com.dailyschedule.domain.tag;

import java.util.List;
import java.util.Optional;

public interface TagRepository {
    List<Tag> findAll();
    Optional<Tag> findById(Long id);
    Tag save(Tag tag);
    void delete(Long id);
    List<Tag> findByEventId(Long eventId);
}
