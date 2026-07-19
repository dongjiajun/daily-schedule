package com.dailyschedule.api.assembler;

import com.dailyschedule.api.generated.dto.LoginResponse;
import com.dailyschedule.api.generated.dto.UserResponse;
import com.dailyschedule.application.auth.Tokens;
import com.dailyschedule.domain.user.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class UserAssemblerTest {

    @Test
    @DisplayName("toResponse: 完整字段映射")
    void toResponse_mapsAllFields() {
        User u = new User();
        u.setId(1L);
        u.setUsername("testuser");
        u.setEmail("test@example.com");
        u.setDisplayName("Test User");
        u.setAvatarUrl("https://example.com/avatar.png");
        u.setCreatedAt(LocalDateTime.of(2026, 7, 1, 0, 0));

        UserResponse resp = UserAssembler.toResponse(u);

        assertThat(resp.getId()).isEqualTo(1L);
        assertThat(resp.getUsername()).isEqualTo("testuser");
        assertThat(resp.getEmail()).isEqualTo("test@example.com");
        assertThat(resp.getDisplayName()).isEqualTo("Test User");
        assertThat(resp.getAvatarUrl()).isEqualTo("https://example.com/avatar.png");
        assertThat(resp.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 7, 1, 0, 0));
    }

    @Test
    @DisplayName("toResponse: 可选字段为 null 时不抛异常")
    void toResponse_nullableFields_null() {
        User u = new User();
        u.setId(1L);
        u.setUsername("minimal");
        u.setEmail("min@test.com");

        UserResponse resp = UserAssembler.toResponse(u);

        assertThat(resp.getUsername()).isEqualTo("minimal");
        assertThat(resp.getDisplayName()).isNull();
        assertThat(resp.getAvatarUrl()).isNull();
        assertThat(resp.getCreatedAt()).isNull();
    }

    @Test
    @DisplayName("toLoginResponse: Tokens 转换为 LoginResponse")
    void toLoginResponse_mapsTokens() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setDisplayName("Test User");

        Tokens tokens = new Tokens("access-token", "refresh-token", 900L, user);

        LoginResponse resp = UserAssembler.toLoginResponse(tokens);

        assertThat(resp.getAccessToken()).isEqualTo("access-token");
        assertThat(resp.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(resp.getExpiresIn()).isEqualTo(900);
        assertThat(resp.getUser()).isNotNull();
        assertThat(resp.getUser().getUsername()).isEqualTo("testuser");
        assertThat(resp.getUser().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("toLoginResponse: expiresIn 从 long 转为 int")
    void toLoginResponse_expiresInConversion() {
        User user = new User();
        user.setId(1L);
        user.setUsername("u");
        user.setEmail("u@test.com");

        Tokens tokens = new Tokens("a", "b", 3600L, user);

        LoginResponse resp = UserAssembler.toLoginResponse(tokens);

        assertThat(resp.getExpiresIn()).isEqualTo(3600);
    }
}
