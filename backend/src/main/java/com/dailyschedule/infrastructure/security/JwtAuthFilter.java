package com.dailyschedule.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * 解析 JWT 并注入 SecurityContext。
 *
 * <p>支持两种 token 来源（优先级递减）：
 * <ol>
 *   <li>{@code Authorization: Bearer <jwt>}（XHR/fetch 场景，主路径）</li>
 *   <li>Cookie {@code dsa_sse_session=<jwt>}（SSE/EventSource 场景；
 *       浏览器不允许 EventSource 设置自定义 header）</li>
 * </ol>
 * 两种 token 都使用同一个 access JWT；任意一个有效即视为已认证。</p>
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    /** SSE Cookie 名称，须与 AuthController.setSseCookie 保持一致。 */
    public static final String SSE_COOKIE = "dsa_sse_session";

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = extractToken(request);
            if (token != null && jwtUtil.validateToken(token)) {
                Long userId = jwtUtil.getUserId(token);
                if (userId != null) {
                    UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(userId, null, List.of());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }
        filterChain.doFilter(request, response);
    }

    private static String extractToken(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        Cookie[] cookies = req.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if (SSE_COOKIE.equals(c.getName())) {
                    return c.getValue();
                }
            }
        }
        return null;
    }
}
