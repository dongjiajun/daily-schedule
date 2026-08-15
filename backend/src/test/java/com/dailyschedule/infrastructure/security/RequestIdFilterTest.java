package com.dailyschedule.infrastructure.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import jakarta.servlet.FilterChain;

import static org.assertj.core.api.Assertions.assertThat;

class RequestIdFilterTest {

    private final RequestIdFilter filter = new RequestIdFilter();

    @AfterEach
    void clearMdc() {
        MDC.clear();
    }

    @Test
    @DisplayName("请求携带 X-Request-Id → MDC 与响应头沿用")
    void incomingRequestId_shouldBeReused() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Request-Id", "trace-42");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getHeader("X-Request-Id")).isEqualTo("trace-42");
    }

    @Test
    @DisplayName("链内执行时 MDC 含 requestId")
    void mdc_shouldCarryRequestId_duringChain() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Request-Id", "trace-42");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (req, res) ->
            assertThat(MDC.get("requestId")).isEqualTo("trace-42");

        filter.doFilter(request, response, chain);

        assertThat(response.getHeader("X-Request-Id")).isEqualTo("trace-42");
    }

    @Test
    @DisplayName("无 X-Request-Id → 生成 UUID 并回写响应头")
    void missingRequestId_shouldGenerateUuid() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        String generated = response.getHeader("X-Request-Id");
        assertThat(generated).isNotBlank();
        assertThat(generated).hasSize(36); // UUID 格式
    }

    @Test
    @DisplayName("超长 X-Request-Id（>64）→ 拒绝沿用并生成新值")
    void oversizedRequestId_shouldRegenerate() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Request-Id", "x".repeat(100));
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        String generated = response.getHeader("X-Request-Id");
        assertThat(generated).hasSize(36);
    }

    @Test
    @DisplayName("请求结束 MDC 清理（finally）")
    void mdc_shouldBeCleared_afterChain() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Request-Id", "trace-42");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (req, res) -> {
            throw new RuntimeException("chain 中途异常");
        };

        try {
            filter.doFilter(request, response, chain);
        } catch (RuntimeException ignored) {
            // 异常路径也要验证 finally 清理
        }

        assertThat(MDC.get("requestId")).isNull();
    }
}
