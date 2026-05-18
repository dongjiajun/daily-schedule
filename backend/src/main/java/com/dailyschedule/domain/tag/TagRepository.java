package com.dailyschedule.domain.tag;

import java.util.List;
import java.util.Optional;

public interface TagRepository {
    List<Tag> findAll(Long userId);
    Optional<Tag> findById(Long id);
    Tag save(Tag tag);
    void delete(Long id);
    List<Tag> findByEventId(Long eventId);

    boolean existsByName(String name, Long userId);

    /** 查询同名标签但排除指定 ID（用于 update 路径的重名校验）。 */
    boolean existsByNameExcludingId(String name, Long excludeId, Long userId);
}
