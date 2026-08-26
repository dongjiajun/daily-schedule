package com.dailyschedule.api.controller;

import com.dailyschedule.application.auth.AuthApplicationService;
import com.dailyschedule.application.auth.Tokens;
import com.dailyschedule.domain.user.User;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthApplicationService authAppService;

    @MockitoBean
    private CurrentUserService currentUserService;

    private User createUser() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setDisplayName("Test User");
        user.setCreatedAt(LocalDateTime.of(2026, 7, 1, 0, 0));
        return user;
    }

    private Tokens createTokens() {
        return new Tokens("access-token", "refresh-token", 900L, createUser());
    }

    @Test
    @DisplayName("POST /api/v1/auth/login -> 登录成功返回 200")
    void login_shouldReturn200() throws Exception {
        when(authAppService.login(anyString(), anyString())).thenReturn(createTokens());

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"usernameOrEmail\":\"testuser\",\"password\":\"password123\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("access-token"))
            .andExpect(jsonPath("$.user.username").value("testuser"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register -> 注册成功返回 201")
    void register_shouldReturn201() throws Exception {
        when(authAppService.register(any())).thenReturn(createTokens());

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"newuser\",\"email\":\"new@example.com\",\"password\":\"password123\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accessToken").value("access-token"))
            .andExpect(jsonPath("$.user.username").value("testuser"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/wechat-login -> 登录成功返回 200")
    void wechatLogin_shouldReturn200() throws Exception {
        when(authAppService.wechatLogin(any())).thenReturn(createTokens());

        mockMvc.perform(post("/api/v1/auth/wechat-login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"wx-login-code\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("access-token"))
            .andExpect(jsonPath("$.user.username").value("testuser"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh -> 续签成功返回 200")
    void refreshToken_shouldReturn200() throws Exception {
        when(authAppService.refresh(anyString())).thenReturn(createTokens());

        mockMvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"valid-refresh-token\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("access-token"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout -> 注销成功返回 204")
    void logout_shouldReturn204() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /api/v1/auth/me -> 获取当前用户信息返回 200")
    void currentUser_shouldReturn200() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(authAppService.currentUser(anyLong())).thenReturn(createUser());

        mockMvc.perform(get("/api/v1/auth/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("testuser"))
            .andExpect(jsonPath("$.email").value("test@example.com"));
    }
}
