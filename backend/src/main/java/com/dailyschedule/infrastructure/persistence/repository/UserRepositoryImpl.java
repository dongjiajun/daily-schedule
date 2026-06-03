package com.dailyschedule.infrastructure.persistence.repository;

import com.dailyschedule.domain.user.User;
import com.dailyschedule.domain.user.UserRepository;
import com.dailyschedule.domain.user.UserStatus;
import com.dailyschedule.infrastructure.persistence.mapper.UserMapper;
import com.dailyschedule.infrastructure.persistence.po.UserPO;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public class UserRepositoryImpl implements UserRepository {

    private final UserMapper userMapper;

    public UserRepositoryImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(userMapper.selectById(id)).map(this::toDomain);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return Optional.ofNullable(userMapper.selectByUsername(username)).map(this::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return Optional.ofNullable(userMapper.selectByEmail(email)).map(this::toDomain);
    }

    @Override
    public Optional<User> findByUsernameOrEmail(String usernameOrEmail) {
        return Optional.ofNullable(userMapper.selectByUsernameOrEmail(usernameOrEmail))
            .map(this::toDomain);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userMapper.selectByUsername(username) != null;
    }

    @Override
    public boolean existsByEmail(String email) {
        return userMapper.selectByEmail(email) != null;
    }

    @Override
    public User save(User user) {
        UserPO po = toPO(user);
        if (user.getId() == null) {
            userMapper.insert(po);
            user.setId(po.getId());
            user.setCreatedAt(po.getCreatedAt());
            user.setUpdatedAt(po.getUpdatedAt());
        } else {
            userMapper.updateById(po);
        }
        return user;
    }

    @Override
    public void updateLastLogin(Long id, LocalDateTime when) {
        userMapper.updateLastLogin(id, when);
    }

    private User toDomain(UserPO po) {
        User u = new User();
        u.setId(po.getId());
        u.setUsername(po.getUsername());
        u.setEmail(po.getEmail());
        u.setPasswordHash(po.getPasswordHash());
        u.setDisplayName(po.getDisplayName());
        u.setAvatarUrl(po.getAvatarUrl());
        u.setStatus(po.getStatus() == null
            ? UserStatus.ACTIVE
            : UserStatus.valueOf(po.getStatus()));
        u.setLastLoginAt(po.getLastLoginAt());
        u.setCreatedAt(po.getCreatedAt());
        u.setUpdatedAt(po.getUpdatedAt());
        return u;
    }

    private UserPO toPO(User u) {
        UserPO po = new UserPO();
        po.setId(u.getId());
        po.setUsername(u.getUsername());
        po.setEmail(u.getEmail());
        po.setPasswordHash(u.getPasswordHash());
        po.setDisplayName(u.getDisplayName());
        po.setAvatarUrl(u.getAvatarUrl());
        po.setStatus(u.getStatus() == null
            ? UserStatus.ACTIVE.name()
            : u.getStatus().name());
        po.setLastLoginAt(u.getLastLoginAt());
        return po;
    }
}
