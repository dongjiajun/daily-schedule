package com.dailyschedule.application.auth;

import com.dailyschedule.domain.user.User;

/**
 * 登录/注册/刷新成功后的统一返回值。
 *
 * @param accessToken   短有效期 JWT，用于 Authorization Bearer
 * @param refreshToken  长有效期 JWT，用于 /auth/refresh
 * @param expiresIn     accessToken 有效期（秒）
 * @param user          已登录用户
 */
public record Tokens(String accessToken,
                     String refreshToken,
                     long expiresIn,
                     User user) {
}
