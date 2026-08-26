package com.dailyschedule.api.controller;

import com.dailyschedule.api.assembler.UserAssembler;
import com.dailyschedule.api.generated.api.AuthApi;
import com.dailyschedule.api.generated.dto.LoginRequest;
import com.dailyschedule.api.generated.dto.LoginResponse;
import com.dailyschedule.api.generated.dto.RefreshRequest;
import com.dailyschedule.api.generated.dto.RegisterRequest;
import com.dailyschedule.api.generated.dto.UserResponse;
import com.dailyschedule.api.generated.dto.WechatLoginRequest;
import com.dailyschedule.application.auth.AuthApplicationService;
import com.dailyschedule.application.auth.RegisterCommand;
import com.dailyschedule.application.auth.Tokens;
import com.dailyschedule.application.auth.WechatLoginCommand;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import com.dailyschedule.infrastructure.security.JwtAuthFilter;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@RestController
@RequestMapping("/api/v1")
public class AuthController implements AuthApi {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthApplicationService authAppService;
    private final CurrentUserService currentUserService;

    public AuthController(AuthApplicationService authAppService,
                          CurrentUserService currentUserService) {
        this.authAppService = authAppService;
        this.currentUserService = currentUserService;
    }

    @Override
    @ResponseStatus(HttpStatus.CREATED)
    public LoginResponse register(RegisterRequest request) {
        log.info("register: username={} email={}", request.getUsername(), request.getEmail());
        Tokens tokens = authAppService.register(new RegisterCommand(
            request.getUsername(),
            request.getEmail(),
            request.getPassword(),
            request.getDisplayName()
        ));
        setSseCookie(tokens.accessToken());
        return UserAssembler.toLoginResponse(tokens);
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        log.info("login: usernameOrEmail={}", request.getUsernameOrEmail());
        Tokens tokens = authAppService.login(request.getUsernameOrEmail(), request.getPassword());
        setSseCookie(tokens.accessToken());
        return UserAssembler.toLoginResponse(tokens);
    }

    @Override
    public LoginResponse wechatLogin(WechatLoginRequest request) {
        log.info("wechatLogin: code=<redacted>");
        Tokens tokens = authAppService.wechatLogin(new WechatLoginCommand(request.getCode()));
        // 小程序走 Bearer header 鉴权，不使用 EventSource，故不下发 dsa_sse_session Cookie（与 Web 端 login/refresh 不同）
        return UserAssembler.toLoginResponse(tokens);
    }

    @Override
    public LoginResponse refreshToken(RefreshRequest request) {
        log.info("refreshToken");
        Tokens tokens = authAppService.refresh(request.getRefreshToken());
        setSseCookie(tokens.accessToken());
        return UserAssembler.toLoginResponse(tokens);
    }

    @Override
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout() {
        log.info("logout");
        clearSseCookie();
    }

    @Override
    public UserResponse currentUser() {
        Long userId = currentUserService.getCurrentUserId();
        log.info("currentUser: userId={}", userId);
        return UserAssembler.toResponse(authAppService.currentUser(userId));
    }

    /**
     * 把 access token 写入 HttpOnly Cookie 供 SSE 鉴权。
     * EventSource 不支持自定义 header，因此 SSE 必须依赖 Cookie。
     * Path 限定 {@code /api/v1/sse} 避免其他端点也读到这个 cookie。
     */
    private void setSseCookie(String accessToken) {
        HttpServletResponse resp = currentResponse();
        if (resp == null) return;
        Cookie c = new Cookie(JwtAuthFilter.SSE_COOKIE, accessToken);
        c.setHttpOnly(true);
        c.setSecure(false);   // 生产部署 HTTPS 时改为 true（建议放 application-prod.yml 控制）
        c.setPath("/api/v1/sse");
        c.setMaxAge(60 * 60); // 1h；SSE 端点本身仍可正常重连，重连时若 access 已失效，前端走 refresh 后重新建立连接
        resp.addCookie(c);
        resp.addHeader("Set-Cookie", c.getName() + "=" + c.getValue()
            + "; Path=" + c.getPath() + "; HttpOnly; SameSite=Lax; Max-Age=" + c.getMaxAge());
    }

    private void clearSseCookie() {
        HttpServletResponse resp = currentResponse();
        if (resp == null) return;
        Cookie c = new Cookie(JwtAuthFilter.SSE_COOKIE, "");
        c.setHttpOnly(true);
        c.setPath("/api/v1/sse");
        c.setMaxAge(0);
        resp.addCookie(c);
        resp.addHeader("Set-Cookie", JwtAuthFilter.SSE_COOKIE
            + "=; Path=/api/v1/sse; HttpOnly; SameSite=Lax; Max-Age=0");
    }

    private static HttpServletResponse currentResponse() {
        var attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            return sra.getResponse();
        }
        return null;
    }
}
