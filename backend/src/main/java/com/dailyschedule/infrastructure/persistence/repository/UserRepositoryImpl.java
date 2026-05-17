package com.dailyschedule.infrastructure.persistence.repository;

import com.dailyschedule.domain.user.User;
import com.dailyschedule.domain.user.UserRepository;
import com.dailyschedule.infrastructure.persistence.mapper.UserMapper;
import com.dailyschedule.infrastructure.persistence.po.UserPO;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class UserRepositoryImpl implements UserRepository {

    private final UserMapper userMapper;

    public UserRepositoryImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Override
    public Optional<User> findById(Long id) {
        UserPO po = userMapper.selectById(id);
        return po == null ? Optional.empty() : Optional.of(toDomain(po));
    }

    @Override
    public Optional<User> findByUsername(String username) {
        UserPO po = userMapper.selectByUsername(username);
        return po == null ? Optional.empty() : Optional.of(toDomain(po));
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
    public boolean existsByUsername(String username) {
        return userMapper.selectByUsername(username) != null;
    }

    private User toDomain(UserPO po) {
        User u = new User();
        u.setId(po.getId());
        u.setUsername(po.getUsername());
        u.setPasswordHash(po.getPasswordHash());
        u.setCreatedAt(po.getCreatedAt());
        u.setUpdatedAt(po.getUpdatedAt());
        return u;
    }

    private UserPO toPO(User user) {
        UserPO po = new UserPO();
        po.setId(user.getId());
        po.setUsername(user.getUsername());
        po.setPasswordHash(user.getPasswordHash());
        return po;
    }
}
