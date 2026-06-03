package com.dailyschedule.infrastructure.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private static final String SECRET = "test-secret-key-must-be-at-least-256-bits-long-padding!!";

    private JwtUtil util;

    @BeforeEach
    void setUp() {
        util = new JwtUtil(SECRET, 900, 604800, null);
    }

    @Test
    @DisplayName("access token 生成 + 解析：subject=userId, claim username, typ=access")
    void accessToken_roundTrip() {
        String token = util.generateAccessToken(42L, "alice");
        Claims claims = util.parse(token, JwtUtil.TYPE_ACCESS);
        assertThat(claims).isNotNull();
        assertThat(claims.getSubject()).isEqualTo("42");
        assertThat(claims.get(JwtUtil.CLAIM_USERNAME)).isEqualTo("alice");
        assertThat(claims.get(JwtUtil.CLAIM_TYPE)).isEqualTo(JwtUtil.TYPE_ACCESS);
    }

    @Test
    @DisplayName("refresh token 生成 + 解析：typ=refresh")
    void refreshToken_roundTrip() {
        String token = util.generateRefreshToken(7L, "bob");
        Claims claims = util.parse(token, JwtUtil.TYPE_REFRESH);
        assertThat(claims).isNotNull();
        assertThat(claims.getSubject()).isEqualTo("7");
        assertThat(claims.get(JwtUtil.CLAIM_TYPE)).isEqualTo(JwtUtil.TYPE_REFRESH);
    }

    @Test
    @DisplayName("typ 不匹配 → parse 返回 null")
    void typeMismatch_returnsNull() {
        String access = util.generateAccessToken(1L, "a");
        assertThat(util.parse(access, JwtUtil.TYPE_REFRESH)).isNull();

        String refresh = util.generateRefreshToken(1L, "a");
        assertThat(util.parse(refresh, JwtUtil.TYPE_ACCESS)).isNull();
    }

    @Test
    @DisplayName("expectedType=null → 仅校验签名与过期")
    void noTypeCheck_returnsClaimsRegardless() {
        assertThat(util.parse(util.generateAccessToken(1L, "a"), null)).isNotNull();
        assertThat(util.parse(util.generateRefreshToken(1L, "a"), null)).isNotNull();
    }

    @Test
    @DisplayName("被篡改的 token → 返回 null")
    void tampered_returnsNull() {
        String original = util.generateAccessToken(1L, "a");
        // 翻转最后一段签名的某个字符
        int mid = original.lastIndexOf('.') + 5;
        char c = original.charAt(mid);
        String tampered = original.substring(0, mid)
            + (c == 'A' ? 'B' : 'A')
            + original.substring(mid + 1);
        assertThat(util.parse(tampered, JwtUtil.TYPE_ACCESS)).isNull();
        assertThat(util.validateToken(tampered)).isFalse();

        // 完全非 JWT 字符串也应返回 null
        assertThat(util.parse("not-a-jwt", JwtUtil.TYPE_ACCESS)).isNull();
    }

    @Test
    @DisplayName("空 / null token → 返回 null")
    void blank_returnsNull() {
        assertThat(util.parse(null, JwtUtil.TYPE_ACCESS)).isNull();
        assertThat(util.parse("", JwtUtil.TYPE_ACCESS)).isNull();
        assertThat(util.parse("   ", JwtUtil.TYPE_ACCESS)).isNull();
    }

    @Test
    @DisplayName("validateToken / getUserId：access 路径")
    void validateAndGetUserId() {
        String token = util.generateAccessToken(99L, "x");
        assertThat(util.validateToken(token)).isTrue();
        assertThat(util.getUserId(token)).isEqualTo(99L);
    }

    @Test
    @DisplayName("getAccessTtlSeconds：返回构造时配置")
    void ttlSeconds_returnedAsConfigured() {
        assertThat(util.getAccessTtlSeconds()).isEqualTo(900L);
    }

    @Test
    @DisplayName("v1.1 兼容入口 generateToken == generateAccessToken")
    void legacyEntryEquivalent() {
        String legacy = util.generateToken(5L, "x");
        Claims claims = util.parse(legacy, JwtUtil.TYPE_ACCESS);
        assertThat(claims).isNotNull();
        assertThat(claims.getSubject()).isEqualTo("5");
    }

    @Test
    @DisplayName("v1.1 兼容配置 jwt.expiration-ms 优先级高于 access-ttl-seconds")
    void legacyExpirationOverride() {
        JwtUtil legacy = new JwtUtil(SECRET, 900, 604800, 1_800_000L);
        assertThat(legacy.getAccessTtlSeconds()).isEqualTo(1800L);
    }
}
