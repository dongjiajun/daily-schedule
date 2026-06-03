package com.dailyschedule.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class JwtAuthFilterTest {

    private static final String SECRET = "test-secret-key-must-be-at-least-256-bits-long-padding!!";

    private JwtUtil jwtUtil;
    private JwtAuthFilter filter;
    private FilterChain chain;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(SECRET, 900, 604800, null);
        filter = new JwtAuthFilter(jwtUtil);
        chain = mock(FilterChain.class);
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Bearer header 合法 → SecurityContext 注入 userId")
    void bearerHeader_setsAuthentication() throws Exception {
        String token = jwtUtil.generateAccessToken(7L, "alice");
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse resp = new MockHttpServletResponse();

        filter.doFilter(req, resp, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
            .isEqualTo(7L);
        verify(chain).doFilter(req, resp);
    }

    @Test
    @DisplayName("Cookie dsa_sse_session 合法 → SecurityContext 注入 userId")
    void cookieFallback_setsAuthentication() throws Exception {
        String token = jwtUtil.generateAccessToken(33L, "bob");
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setCookies(new Cookie(JwtAuthFilter.SSE_COOKIE, token));
        MockHttpServletResponse resp = new MockHttpServletResponse();

        filter.doFilter(req, resp, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
            .isEqualTo(33L);
    }

    @Test
    @DisplayName("Bearer 与 Cookie 同时存在 → 优先采用 Bearer")
    void bearerWinsOverCookie() throws Exception {
        String bearer = jwtUtil.generateAccessToken(1L, "a");
        String cookie = jwtUtil.generateAccessToken(2L, "b");
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer " + bearer);
        req.setCookies(new Cookie(JwtAuthFilter.SSE_COOKIE, cookie));

        filter.doFilter(req, new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
            .isEqualTo(1L);
    }

    @Test
    @DisplayName("无 token → SecurityContext 不被设置，filter 链继续")
    void noToken_noAuthentication() throws Exception {
        HttpServletRequest req = new MockHttpServletRequest();
        HttpServletResponse resp = new MockHttpServletResponse();

        filter.doFilter(req, resp, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(req, resp);
    }

    @Test
    @DisplayName("非法 token → SecurityContext 不被设置")
    void invalidToken_noAuthentication() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer not-a-jwt");

        filter.doFilter(req, new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("非 Bearer 开头的 Authorization → 跳过 header，尝试 cookie")
    void nonBearerHeader_fallsBackToCookie() throws Exception {
        String token = jwtUtil.generateAccessToken(55L, "x");
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Basic xxx");
        req.setCookies(new Cookie(JwtAuthFilter.SSE_COOKIE, token));

        filter.doFilter(req, new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
            .isEqualTo(55L);
    }
}
