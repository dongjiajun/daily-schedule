package com.dailyschedule.infrastructure.persistence.repository;

import com.dailyschedule.domain.user.User;
import com.dailyschedule.domain.user.UserStatus;
import com.dailyschedule.infrastructure.persistence.mapper.UserMapper;
import com.dailyschedule.infrastructure.persistence.po.UserPO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserRepositoryImplTest {

    @Mock
    private UserMapper userMapper;

    private UserRepositoryImpl repository;

    @BeforeEach
    void setUp() {
        repository = new UserRepositoryImpl(userMapper);
    }

    @Test
    @DisplayName("findByUsername: 找到时返回 User")
    void findByUsername_found_returnsUser() {
        when(userMapper.selectByUsername("testuser")).thenReturn(samplePO(1L, "testuser"));

        Optional<User> result = repository.findByUsername("testuser");

        assertThat(result).isPresent();
        assertThat(result.get().getUsername()).isEqualTo("testuser");
        assertThat(result.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("findByUsername: 未找到时返回 Optional.empty()")
    void findByUsername_notFound_returnsEmpty() {
        when(userMapper.selectByUsername("nonexistent")).thenReturn(null);

        Optional<User> result = repository.findByUsername("nonexistent");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findByEmail: 找到时返回 User")
    void findByEmail_found_returnsUser() {
        when(userMapper.selectByEmail("test@example.com")).thenReturn(samplePO(1L, "testuser"));

        Optional<User> result = repository.findByEmail("test@example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("findByEmail: 未找到时返回 Optional.empty()")
    void findByEmail_notFound_returnsEmpty() {
        when(userMapper.selectByEmail("missing@example.com")).thenReturn(null);

        Optional<User> result = repository.findByEmail("missing@example.com");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findByUsernameOrEmail: 通过用户名查询")
    void findByUsernameOrEmail_byUsername() {
        when(userMapper.selectByUsernameOrEmail("testuser")).thenReturn(samplePO(1L, "testuser"));

        Optional<User> result = repository.findByUsernameOrEmail("testuser");

        assertThat(result).isPresent();
        assertThat(result.get().getUsername()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("findByUsernameOrEmail: 未找到时返回 Optional.empty()")
    void findByUsernameOrEmail_notFound_returnsEmpty() {
        when(userMapper.selectByUsernameOrEmail("unknown")).thenReturn(null);

        Optional<User> result = repository.findByUsernameOrEmail("unknown");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("save (insert): 新用户调用 insert，回填 id")
    void save_newUser_callsInsert() {
        User user = new User();
        user.setUsername("newuser");
        user.setEmail("new@example.com");
        user.setPasswordHash("hashed-password");
        user.setDisplayName("New User");

        doAnswer(inv -> {
            UserPO po = inv.getArgument(0);
            po.setId(100L);
            po.setCreatedAt(LocalDateTime.of(2026, 7, 1, 8, 0));
            po.setUpdatedAt(LocalDateTime.of(2026, 7, 1, 8, 0));
            return 1;
        }).when(userMapper).insert(any(UserPO.class));

        User saved = repository.save(user);

        ArgumentCaptor<UserPO> captor = ArgumentCaptor.forClass(UserPO.class);
        verify(userMapper).insert(captor.capture());
        assertThat(captor.getValue().getUsername()).isEqualTo("newuser");
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("hashed-password");
        assertThat(captor.getValue().getDisplayName()).isEqualTo("New User");
        assertThat(captor.getValue().getStatus()).isEqualTo("ACTIVE");
        assertThat(saved.getId()).isEqualTo(100L);
    }

    @Test
    @DisplayName("save (update): 已有 id 调用 updateById")
    void save_existingUser_callsUpdateById() {
        User user = new User();
        user.setId(50L);
        user.setUsername("existing");
        user.setEmail("existing@example.com");
        user.setPasswordHash("hashed");

        repository.save(user);

        verify(userMapper).updateById(any(UserPO.class));
        verify(userMapper, never()).insert(any(UserPO.class));
    }

    @Test
    @DisplayName("updateLastLogin: 调用 mapper 更新")
    void updateLastLogin_callsMapper() {
        LocalDateTime now = LocalDateTime.of(2026, 7, 1, 10, 0);

        repository.updateLastLogin(1L, now);

        verify(userMapper).updateLastLogin(1L, now);
    }

    @Test
    @DisplayName("PO -> Domain: status 映射为枚举")
    void toDomain_mapsStatus() {
        UserPO po = samplePO(1L, "testuser");

        when(userMapper.selectByUsername("testuser")).thenReturn(po);

        User user = repository.findByUsername("testuser").orElseThrow();

        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    @DisplayName("PO -> Domain: status 为 null 时默认 ACTIVE")
    void toDomain_nullStatus_defaultsToActive() {
        UserPO po = samplePO(1L, "testuser");
        po.setStatus(null);

        when(userMapper.selectByUsername("testuser")).thenReturn(po);

        User user = repository.findByUsername("testuser").orElseThrow();

        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
    }

    private static UserPO samplePO(Long id, String username) {
        UserPO po = new UserPO();
        po.setId(id);
        po.setUsername(username);
        po.setEmail("test@example.com");
        po.setPasswordHash("hashed-password");
        po.setDisplayName(username);
        po.setStatus("ACTIVE");
        po.setCreatedAt(LocalDateTime.of(2026, 7, 1, 0, 0));
        po.setUpdatedAt(LocalDateTime.of(2026, 7, 1, 0, 0));
        return po;
    }
}
