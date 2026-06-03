package com.dailyschedule.domain.user;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserRepository {

    Optional<User> findById(Long id);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    /** 通过 username 或 email 任一匹配（登录场景）。 */
    Optional<User> findByUsernameOrEmail(String usernameOrEmail);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    User save(User user);

    /** 仅写 last_login_at，避免无意义全字段更新。 */
    void updateLastLogin(Long id, LocalDateTime when);
}
