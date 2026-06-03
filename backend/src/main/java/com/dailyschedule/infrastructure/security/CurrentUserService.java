package com.dailyschedule.infrastructure.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * 从 SecurityContext 中提取当前用户 ID。
 * <p>{@link JwtAuthFilter} 在请求进入时把 userId 作为 principal 注入；
 * Controller / ApplicationService 通过本服务读取。</p>
 */
@Component
public class CurrentUserService {

    public Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long userId) {
            return userId;
        }
        throw new IllegalStateException("未登录");
    }
}
