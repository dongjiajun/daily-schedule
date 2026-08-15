package com.dailyschedule.infrastructure.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * CORS 单轨配置行为验证（保留 Spring Security 过滤器链）。
 * 覆盖 cors-configuration spec：匹配源预检放行、不匹配源拒绝、CORS 放行不等于端点公开。
 */
@SpringBootTest
@AutoConfigureMockMvc
class CorsConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("预检：匹配源返回 CORS 放行头（回显 origin + 允许凭证）")
    void preflight_matchingOrigin_shouldAllow() throws Exception {
        mockMvc.perform(options("/api/v1/events")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
            .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("预检：不匹配源被拒绝且无放行头")
    void preflight_nonMatchingOrigin_shouldReject() throws Exception {
        mockMvc.perform(options("/api/v1/events")
                .header("Origin", "http://evil.example.com")
                .header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isForbidden())
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    @DisplayName("未认证非预检请求返回 401（CORS 放行不改变端点认证要求）")
    void unauthenticatedRequest_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/events")
                .header("Origin", "http://localhost:5173"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("RequestIdFilter 注册于 Security 之前：401 响应携带 X-Request-Id 头")
    void unauthenticatedRequest_shouldCarryRequestId() throws Exception {
        mockMvc.perform(get("/api/v1/events"))
            .andExpect(status().isUnauthorized())
            .andExpect(header().exists("X-Request-Id"));
    }

    @Test
    @DisplayName("客户端 X-Request-Id 沿用到 401 响应")
    void incomingRequestId_shouldBeEchoed() throws Exception {
        mockMvc.perform(get("/api/v1/events")
                .header("X-Request-Id", "trace-42"))
            .andExpect(status().isUnauthorized())
            .andExpect(header().string("X-Request-Id", "trace-42"));
    }

    @Test
    @DisplayName("Actuator health 匿名探活返回 UP")
    void actuatorHealth_shouldReturnUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }
}
