package com.dailyschedule.domain.user;

import java.util.Optional;

public interface UserRepository {
    Optional<User> findById(Long id);
    Optional<User> findByUsername(String username);
    User save(User user);
    boolean existsByUsername(String username);
}
