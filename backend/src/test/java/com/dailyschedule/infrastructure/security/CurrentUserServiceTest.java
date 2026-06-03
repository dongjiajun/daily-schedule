package com.dailyschedule.infrastructure.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CurrentUserServiceTest {

    private final CurrentUserService svc = new CurrentUserService();

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("principal 为 Long → 返回 userId")
    void principalLong_returnsId() {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(42L, null, List.of()));
        assertThat(svc.getCurrentUserId()).isEqualTo(42L);
    }

    @Test
    @DisplayName("无认证 → IllegalStateException")
    void noAuth_throws() {
        assertThatThrownBy(svc::getCurrentUserId)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("未登录");
    }

    @Test
    @DisplayName("principal 非 Long → IllegalStateException")
    void wrongPrincipalType_throws() {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("not-a-long", null, List.of()));
        assertThatThrownBy(svc::getCurrentUserId)
            .isInstanceOf(IllegalStateException.class);
    }
}
