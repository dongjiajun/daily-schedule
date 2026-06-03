package com.dailyschedule.application.auth;

import com.dailyschedule.application.auth.AuthApplicationService.DuplicateAccountException;
import com.dailyschedule.application.auth.AuthApplicationService.InvalidCredentialsException;
import com.dailyschedule.domain.category.Category;
import com.dailyschedule.domain.category.CategoryRepository;
import com.dailyschedule.domain.user.PasswordHasher;
import com.dailyschedule.domain.user.User;
import com.dailyschedule.domain.user.UserRepository;
import com.dailyschedule.domain.user.UserStatus;
import com.dailyschedule.infrastructure.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthApplicationServiceTest {

    private static final String SECRET = "test-secret-key-must-be-at-least-256-bits-long-padding!!";

    @Mock private UserRepository userRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private PasswordHasher passwordHasher;

    private JwtUtil jwtUtil;
    private AuthApplicationService svc;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(SECRET, 900, 604800, null);
        svc = new AuthApplicationService(userRepository, categoryRepository, passwordHasher, jwtUtil);
    }

    @Test
    @DisplayName("register：合法输入 → 创建用户 + 6 个默认分类 + 返回 access/refresh tokens")
    void register_validInput_createsUserAndCategories() {
        RegisterCommand cmd = new RegisterCommand("alice", "alice@example.com", "secret123", "Alice");
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordHasher.hash("secret123")).thenReturn("$2a$10$hashed");
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(42L);
            return u;
        });

        Tokens tokens = svc.register(cmd);

        ArgumentCaptor<User> userCap = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCap.capture());
        assertThat(userCap.getValue().getUsername()).isEqualTo("alice");
        assertThat(userCap.getValue().getEmail()).isEqualTo("alice@example.com");
        assertThat(userCap.getValue().getDisplayName()).isEqualTo("Alice");
        assertThat(userCap.getValue().getPasswordHash()).isEqualTo("$2a$10$hashed");

        verify(categoryRepository, times(6)).save(any(Category.class));

        assertThat(tokens.accessToken()).isNotBlank();
        assertThat(tokens.refreshToken()).isNotBlank();
        assertThat(tokens.expiresIn()).isEqualTo(900L);
        assertThat(tokens.user().getId()).isEqualTo(42L);
    }

    @Test
    @DisplayName("register：displayName 为空 → 用 username 兜底")
    void register_nullDisplayName_usesUsername() {
        RegisterCommand cmd = new RegisterCommand("bob", "bob@example.com", "secret123", null);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordHasher.hash(anyString())).thenReturn("x");
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });

        svc.register(cmd);

        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(cap.capture());
        assertThat(cap.getValue().getDisplayName()).isEqualTo("bob");
    }

    @Test
    @DisplayName("register：用户名重复 → DuplicateAccountException")
    void register_duplicateUsername_throws() {
        when(userRepository.existsByUsername("alice")).thenReturn(true);
        RegisterCommand cmd = new RegisterCommand("alice", "alice@example.com", "secret123", null);

        assertThatThrownBy(() -> svc.register(cmd))
            .isInstanceOf(DuplicateAccountException.class)
            .hasMessageContaining("用户名");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("register：邮箱重复 → DuplicateAccountException")
    void register_duplicateEmail_throws() {
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);
        RegisterCommand cmd = new RegisterCommand("alice", "alice@example.com", "secret123", null);

        assertThatThrownBy(() -> svc.register(cmd))
            .isInstanceOf(DuplicateAccountException.class)
            .hasMessageContaining("邮箱");
    }

    @Test
    @DisplayName("register：密码太短 → IllegalArgumentException")
    void register_shortPassword_rejected() {
        RegisterCommand cmd = new RegisterCommand("alice", "alice@example.com", "123", null);

        assertThatThrownBy(() -> svc.register(cmd))
            .isInstanceOf(IllegalArgumentException.class);
        verify(userRepository, never()).existsByUsername(any());
    }

    @Test
    @DisplayName("register：邮箱格式不合法 → IllegalArgumentException")
    void register_invalidEmail_rejected() {
        RegisterCommand cmd = new RegisterCommand("alice", "no-at-sign", "secret123", null);

        assertThatThrownBy(() -> svc.register(cmd))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("邮箱");
    }

    @Test
    @DisplayName("register：用户名格式不合法 → IllegalArgumentException")
    void register_invalidUsername_rejected() {
        RegisterCommand cmd = new RegisterCommand("a", "alice@example.com", "secret123", null);

        assertThatThrownBy(() -> svc.register(cmd))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("用户名");
    }

    @Test
    @DisplayName("login：合法凭证 → 返回 tokens + 更新 last_login_at")
    void login_validCredentials_returnsTokens() {
        User user = activeUser(10L, "alice", "alice@example.com");
        when(userRepository.findByUsernameOrEmail("alice")).thenReturn(Optional.of(user));
        when(passwordHasher.matches("secret123", user.getPasswordHash())).thenReturn(true);

        Tokens tokens = svc.login("alice", "secret123");

        assertThat(tokens.user().getId()).isEqualTo(10L);
        verify(userRepository).updateLastLogin(eq(10L), any());
    }

    @Test
    @DisplayName("login：用户不存在 → InvalidCredentialsException")
    void login_userNotFound_throws() {
        when(userRepository.findByUsernameOrEmail("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> svc.login("ghost", "secret123"))
            .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    @DisplayName("login：密码错误 → InvalidCredentialsException")
    void login_wrongPassword_throws() {
        User user = activeUser(10L, "alice", "alice@example.com");
        when(userRepository.findByUsernameOrEmail("alice")).thenReturn(Optional.of(user));
        when(passwordHasher.matches(anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> svc.login("alice", "wrong"))
            .isInstanceOf(InvalidCredentialsException.class);
        verify(userRepository, never()).updateLastLogin(any(), any());
    }

    @Test
    @DisplayName("login：账号被禁用 → InvalidCredentialsException")
    void login_disabledUser_throws() {
        User user = activeUser(10L, "alice", "alice@example.com");
        user.setStatus(UserStatus.DISABLED);
        when(userRepository.findByUsernameOrEmail("alice")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> svc.login("alice", "x"))
            .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    @DisplayName("refresh：合法 refresh token → 重签 access + refresh")
    void refresh_validToken_returnsNewTokens() {
        String refreshToken = jwtUtil.generateRefreshToken(7L, "alice");
        User user = activeUser(7L, "alice", "alice@example.com");
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        Tokens tokens = svc.refresh(refreshToken);

        assertThat(tokens.user().getId()).isEqualTo(7L);
        assertThat(tokens.accessToken()).isNotBlank();
        assertThat(tokens.refreshToken()).isNotBlank();
    }

    @Test
    @DisplayName("refresh：把 access token 当 refresh 传 → InvalidCredentialsException")
    void refresh_wrongTokenType_throws() {
        String accessToken = jwtUtil.generateAccessToken(7L, "alice");
        assertThatThrownBy(() -> svc.refresh(accessToken))
            .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    @DisplayName("refresh：用户已被禁用 → InvalidCredentialsException")
    void refresh_disabledUser_throws() {
        String refreshToken = jwtUtil.generateRefreshToken(7L, "alice");
        User user = activeUser(7L, "alice", "alice@example.com");
        user.setStatus(UserStatus.DISABLED);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> svc.refresh(refreshToken))
            .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    @DisplayName("currentUser：返回 repo 中的用户")
    void currentUser_returnsUser() {
        User user = activeUser(8L, "alice", "alice@example.com");
        when(userRepository.findById(8L)).thenReturn(Optional.of(user));

        User result = svc.currentUser(8L);

        assertThat(result.getId()).isEqualTo(8L);
    }

    @Test
    @DisplayName("currentUser：repo 找不到 → IllegalStateException")
    void currentUser_notFound_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> svc.currentUser(99L))
            .isInstanceOf(IllegalStateException.class);
    }

    private static User activeUser(Long id, String username, String email) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setEmail(email);
        u.setPasswordHash("$2a$10$hashed");
        u.setStatus(UserStatus.ACTIVE);
        return u;
    }

    private static <T> T eq(T value) {
        return org.mockito.ArgumentMatchers.eq(value);
    }
}
