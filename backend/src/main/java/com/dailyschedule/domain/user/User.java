package com.dailyschedule.domain.user;

import java.time.LocalDateTime;
import java.util.regex.Pattern;

/**
 * 用户聚合根。
 *
 * <p>{@code passwordHash} 是 BCrypt 后的串，不应直接外发；密码强度/格式校验由
 * 静态 {@link #validatePassword(String)} 完成，哈希由 {@link PasswordHasher} 端口
 * 在 infrastructure 层实现。</p>
 */
public class User {
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_]+$");
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    public static final int USERNAME_MIN = 3;
    public static final int USERNAME_MAX = 50;
    public static final int PASSWORD_MIN = 8;
    public static final int PASSWORD_MAX = 100;
    public static final int EMAIL_MAX = 120;
    public static final int DISPLAY_NAME_MAX = 50;

    private Long id;
    private String openid;
    private String username;
    private String email;
    private String passwordHash;
    private String displayName;
    private String avatarUrl;
    private UserStatus status = UserStatus.ACTIVE;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public User() {}

    public static void validateUsername(String username) {
        if (username == null
                || username.length() < USERNAME_MIN
                || username.length() > USERNAME_MAX) {
            throw new IllegalArgumentException(
                "用户名长度需在 " + USERNAME_MIN + "-" + USERNAME_MAX + " 之间");
        }
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            throw new IllegalArgumentException("用户名仅允许字母、数字和下划线");
        }
    }

    public static void validateEmail(String email) {
        if (email == null
                || email.length() > EMAIL_MAX
                || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("邮箱格式不合法");
        }
    }

    public static void validatePassword(String rawPassword) {
        if (rawPassword == null
                || rawPassword.length() < PASSWORD_MIN
                || rawPassword.length() > PASSWORD_MAX) {
            throw new IllegalArgumentException(
                "密码长度需在 " + PASSWORD_MIN + "-" + PASSWORD_MAX + " 之间");
        }
    }

    public static void validateDisplayName(String displayName) {
        if (displayName != null && displayName.length() > DISPLAY_NAME_MAX) {
            throw new IllegalArgumentException("显示名最多 " + DISPLAY_NAME_MAX + " 字符");
        }
    }

    public boolean canLogin() {
        return status == UserStatus.ACTIVE;
    }

    public void recordLogin(LocalDateTime when) {
        this.lastLoginAt = when;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOpenid() { return openid; }
    public void setOpenid(String openid) { this.openid = openid; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
