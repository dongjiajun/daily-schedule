package com.dailyschedule.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;

/**
 * JWT 签发与校验。
 *
 * <p>access token：短有效期（默认 15min），claim {@code typ=access}。<br>
 * refresh token：长有效期（默认 7d），claim {@code typ=refresh}，仅供 /auth/refresh 用。</p>
 *
 * <p>HS256；密钥来自环境变量 {@code JWT_SECRET}，至少 256 bit；本地默认值仅供开发。</p>
 */
@Component
public class JwtUtil {

    public static final String CLAIM_TYPE = "typ";
    public static final String CLAIM_USERNAME = "username";
    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    private final SecretKey key;
    private final Duration accessTtl;
    private final Duration refreshTtl;

    public JwtUtil(@Value("${jwt.secret:daily-schedule-secret-key-must-be-at-least-256-bits-long!!}") String secret,
                   @Value("${jwt.access-ttl-seconds:900}") long accessTtlSeconds,
                   @Value("${jwt.refresh-ttl-seconds:604800}") long refreshTtlSeconds,
                   @Value("${jwt.expiration-ms:#{null}}") Long legacyExpirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        // 兼容旧配置 jwt.expiration-ms（v1.1 时期使用）
        if (legacyExpirationMs != null) {
            this.accessTtl = Duration.ofMillis(legacyExpirationMs);
        } else {
            this.accessTtl = Duration.ofSeconds(accessTtlSeconds);
        }
        this.refreshTtl = Duration.ofSeconds(refreshTtlSeconds);
    }

    public String generateAccessToken(Long userId, String username) {
        return build(userId, username, TYPE_ACCESS, accessTtl);
    }

    public String generateRefreshToken(Long userId, String username) {
        return build(userId, username, TYPE_REFRESH, refreshTtl);
    }

    /** v1.1 兼容入口：旧代码仍调用 generateToken；语义等同 access token。 */
    public String generateToken(Long userId, String username) {
        return generateAccessToken(userId, username);
    }

    public long getAccessTtlSeconds() {
        return accessTtl.toSeconds();
    }

    /**
     * 验证并解析 token。
     * @param expectedType {@link #TYPE_ACCESS} 或 {@link #TYPE_REFRESH}；
     *                     传 {@code null} 表示不校验类型（仅校验签名与过期）。
     * @return claims 主体；非法返回 null
     */
    public Claims parse(String token, String expectedType) {
        if (token == null || token.isBlank()) return null;
        try {
            Claims claims = Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
            if (expectedType != null) {
                Object typ = claims.get(CLAIM_TYPE);
                // 兼容 v1.1 旧 token：无 typ claim 视为 access
                if (typ == null) typ = TYPE_ACCESS;
                if (!expectedType.equals(typ)) return null;
            }
            return claims;
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public Long getUserId(String token) {
        Claims claims = parse(token, null);
        if (claims == null) return null;
        return Long.parseLong(claims.getSubject());
    }

    /** v1.1 兼容入口：旧 JwtAuthFilter 调用。等价于 {@code parse(token, ACCESS) != null}。 */
    public boolean validateToken(String token) {
        return parse(token, TYPE_ACCESS) != null;
    }

    private String build(Long userId, String username, String type, Duration ttl) {
        Date now = new Date();
        return Jwts.builder()
            .subject(userId.toString())
            .claim(CLAIM_USERNAME, username)
            .claim(CLAIM_TYPE, type)
            .issuedAt(now)
            .expiration(new Date(now.getTime() + ttl.toMillis()))
            .signWith(key)
            .compact();
    }
}
