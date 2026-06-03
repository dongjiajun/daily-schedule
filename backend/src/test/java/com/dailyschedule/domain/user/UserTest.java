package com.dailyschedule.domain.user;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserTest {

    @Test
    @DisplayName("validateUsername：合法字符 (字母/数字/下划线 3-50 位) 通过")
    void username_valid() {
        User.validateUsername("alice");
        User.validateUsername("user_123");
        User.validateUsername("a".repeat(User.USERNAME_MAX));
    }

    @Test
    @DisplayName("validateUsername：太短 / 太长 / null / 含非法字符 → 抛异常")
    void username_invalid() {
        assertThatThrownBy(() -> User.validateUsername(null))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> User.validateUsername("ab"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> User.validateUsername("a".repeat(User.USERNAME_MAX + 1)))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> User.validateUsername("user name"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> User.validateUsername("user!"))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("validateEmail：合法 RFC-like 邮箱通过")
    void email_valid() {
        User.validateEmail("a@b.co");
        User.validateEmail("user.name+tag@sub.example.com");
    }

    @Test
    @DisplayName("validateEmail：缺 @ / 缺域名 / 太长 / null → 抛异常")
    void email_invalid() {
        assertThatThrownBy(() -> User.validateEmail(null))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> User.validateEmail("no-at"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> User.validateEmail("a@b"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> User.validateEmail("a@" + "b".repeat(User.EMAIL_MAX) + ".co"))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("validatePassword：8-100 位通过；< 8 或 > 100 抛异常")
    void password_lengthBoundary() {
        User.validatePassword("a".repeat(User.PASSWORD_MIN));
        User.validatePassword("a".repeat(User.PASSWORD_MAX));
        assertThatThrownBy(() -> User.validatePassword(null))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> User.validatePassword("short"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> User.validatePassword("a".repeat(User.PASSWORD_MAX + 1)))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("validateDisplayName：null 允许；过长抛异常")
    void displayName_nullAllowed_overflowRejected() {
        User.validateDisplayName(null);
        User.validateDisplayName("Alice");
        assertThatThrownBy(() -> User.validateDisplayName("x".repeat(User.DISPLAY_NAME_MAX + 1)))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("canLogin：仅 ACTIVE 返回 true")
    void canLogin_onlyActive() {
        User u = new User();
        u.setStatus(UserStatus.ACTIVE);
        assertThat(u.canLogin()).isTrue();

        u.setStatus(UserStatus.DISABLED);
        assertThat(u.canLogin()).isFalse();

        u.setStatus(UserStatus.DELETED);
        assertThat(u.canLogin()).isFalse();

        u.setStatus(UserStatus.SYSTEM);
        assertThat(u.canLogin()).isFalse();
    }

    @Test
    @DisplayName("recordLogin：写入 lastLoginAt")
    void recordLogin_setsTimestamp() {
        User u = new User();
        var when = java.time.LocalDateTime.of(2026, 6, 1, 10, 0);
        u.recordLogin(when);
        assertThat(u.getLastLoginAt()).isEqualTo(when);
    }
}
