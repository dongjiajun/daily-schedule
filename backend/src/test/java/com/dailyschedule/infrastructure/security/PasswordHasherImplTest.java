package com.dailyschedule.infrastructure.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordHasherImplTest {

    private final PasswordHasherImpl hasher = new PasswordHasherImpl(new BCryptPasswordEncoder());

    @Test
    @DisplayName("hash → matches 同一明文返回 true")
    void hash_then_matches_true() {
        String hashed = hasher.hash("secret123");
        assertThat(hashed).startsWith("$2a$");
        assertThat(hasher.matches("secret123", hashed)).isTrue();
    }

    @Test
    @DisplayName("matches 错误密码返回 false")
    void matches_wrongPassword_false() {
        String hashed = hasher.hash("secret123");
        assertThat(hasher.matches("wrong", hashed)).isFalse();
    }

    @Test
    @DisplayName("matches null 输入返回 false（不抛异常）")
    void matches_nullInputs_false() {
        String hashed = hasher.hash("secret123");
        assertThat(hasher.matches(null, hashed)).isFalse();
        assertThat(hasher.matches("secret123", null)).isFalse();
        assertThat(hasher.matches(null, null)).isFalse();
    }

    @Test
    @DisplayName("hash 两次同一明文返回不同 hash（BCrypt salt 不同）")
    void hash_producesDifferentSalts() {
        String h1 = hasher.hash("same");
        String h2 = hasher.hash("same");
        assertThat(h1).isNotEqualTo(h2);
        assertThat(hasher.matches("same", h1)).isTrue();
        assertThat(hasher.matches("same", h2)).isTrue();
    }
}
