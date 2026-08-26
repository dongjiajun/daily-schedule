package com.dailyschedule.application.auth;

import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.domain.category.Category;
import com.dailyschedule.domain.category.CategoryRepository;
import com.dailyschedule.domain.user.PasswordHasher;
import com.dailyschedule.domain.user.User;
import com.dailyschedule.domain.user.UserRepository;
import com.dailyschedule.infrastructure.security.JwtUtil;
import com.dailyschedule.infrastructure.wechat.WechatAuthPort;
import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 认证用例编排。<br>
 * 不依赖任何 web / HTTP / cookie 概念；仅围绕 User 聚合 + JWT 端口工作。
 */
@Service
public class AuthApplicationService {

    /** 注册新用户后预置的默认分类（与 v1.1 习惯保持一致）。 */
    private static final List<String[]> DEFAULT_CATEGORIES = List.of(
        new String[]{"工作", "#3b82f6", "工作相关日程"},
        new String[]{"个人", "#10b981", "个人事务与生活"},
        new String[]{"学习", "#f59e0b", "学习与自我提升"},
        new String[]{"健康", "#ef4444", "运动与健康管理"},
        new String[]{"社交", "#8b5cf6", "聚会、活动与社交"},
        new String[]{"旅行", "#06b6d4", "出行与旅游计划"}
    );

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordHasher passwordHasher;
    private final JwtUtil jwtUtil;
    private final WechatAuthPort wechatAuthPort;

    public AuthApplicationService(UserRepository userRepository,
                                  CategoryRepository categoryRepository,
                                  PasswordHasher passwordHasher,
                                  JwtUtil jwtUtil,
                                  WechatAuthPort wechatAuthPort) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.passwordHasher = passwordHasher;
        this.jwtUtil = jwtUtil;
        this.wechatAuthPort = wechatAuthPort;
    }

    @Transactional
    public Tokens register(RegisterCommand cmd) {
        if (cmd == null) throw new IllegalArgumentException("注册请求不能为空");
        User.validateUsername(cmd.username());
        User.validateEmail(cmd.email());
        User.validatePassword(cmd.password());
        User.validateDisplayName(cmd.displayName());

        if (userRepository.existsByUsername(cmd.username())) {
            throw new DuplicateAccountException("用户名已被使用");
        }
        if (userRepository.existsByEmail(cmd.email())) {
            throw new DuplicateAccountException("邮箱已被使用");
        }

        User user = new User();
        user.setUsername(cmd.username());
        user.setEmail(cmd.email());
        user.setDisplayName(cmd.displayName() == null ? cmd.username() : cmd.displayName());
        user.setPasswordHash(passwordHasher.hash(cmd.password()));
        userRepository.save(user);

        seedDefaultCategories(user.getId());

        return issueTokens(user, LocalDateTime.now());
    }

    public Tokens login(String usernameOrEmail, String rawPassword) {
        if (usernameOrEmail == null || rawPassword == null) {
            throw new InvalidCredentialsException();
        }
        User user = userRepository.findByUsernameOrEmail(usernameOrEmail)
            .orElseThrow(InvalidCredentialsException::new);
        if (!user.canLogin()) {
            throw new InvalidCredentialsException();
        }
        if (!passwordHasher.matches(rawPassword, user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        LocalDateTime now = LocalDateTime.now();
        user.recordLogin(now);
        userRepository.updateLastLogin(user.getId(), now);
        return issueTokens(user, now);
    }

    /**
     * 微信小程序登录：code → openid → 按 openid 分流（命中登录 / 未命中静默注册）。
     * 微信上游错误（{@link com.dailyschedule.infrastructure.wechat.WechatApiException}）直接上抛由 API 层映射。
     */
    @Transactional
    public Tokens wechatLogin(WechatLoginCommand cmd) {
        if (cmd == null || cmd.code() == null || cmd.code().isBlank()) {
            throw new IllegalArgumentException("登录凭证不能为空");
        }
        String openid = wechatAuthPort.resolveOpenId(cmd.code());
        User user = userRepository.findByOpenid(openid)
            .orElseGet(() -> registerWechatUser(openid));
        return issueTokens(user, LocalDateTime.now());
    }

    /**
     * 静默注册：username 取 {@code wx_} + openid 前 12 位（去连字符），
     * password_hash 存随机 UUID 的 BCrypt 哈希（不可通过密码登录）。
     */
    private User registerWechatUser(String openid) {
        String safe = openid.replace("-", "");
        String usernameBase = safe.length() >= 12 ? safe.substring(0, 12) : safe;
        String suffix = safe.length() >= 4 ? safe.substring(safe.length() - 4) : safe;
        User user = new User();
        user.setOpenid(openid);
        user.setUsername("wx_" + usernameBase);
        user.setDisplayName("微信用户_" + suffix);
        user.setPasswordHash(passwordHasher.hash(UUID.randomUUID().toString()));
        userRepository.save(user);
        seedDefaultCategories(user.getId());
        return user;
    }

    public Tokens refresh(String refreshToken) {
        Claims claims = jwtUtil.parse(refreshToken, JwtUtil.TYPE_REFRESH);
        if (claims == null) throw new InvalidCredentialsException();
        Long userId;
        try {
            userId = Long.parseLong(claims.getSubject());
        } catch (NumberFormatException e) {
            throw new InvalidCredentialsException();
        }
        User user = userRepository.findById(userId)
            .filter(User::canLogin)
            .orElseThrow(InvalidCredentialsException::new);
        return issueTokens(user, LocalDateTime.now());
    }

    public User currentUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("当前用户已不存在"));
    }

    private Tokens issueTokens(User user, LocalDateTime now) {
        String access = jwtUtil.generateAccessToken(user.getId(), user.getUsername());
        String refresh = jwtUtil.generateRefreshToken(user.getId(), user.getUsername());
        long expiresIn = jwtUtil.getAccessTtlSeconds();
        user.recordLogin(now);
        return new Tokens(access, refresh, expiresIn, user);
    }

    private void seedDefaultCategories(Long userId) {
        for (String[] cat : DEFAULT_CATEGORIES) {
            Category category = new Category(cat[0], cat[1]);
            category.setDescription(cat[2]);
            category.setUserId(userId);
            categoryRepository.save(category);
        }
    }

    /** 用户名 / 邮箱重复（→ HTTP 409）。 */
    public static class DuplicateAccountException extends RuntimeException {
        public DuplicateAccountException(String message) {
            super(message);
        }
    }

    /** 登录信息不正确 / token 失效（→ HTTP 401）。 */
    public static class InvalidCredentialsException extends RuntimeException {
        public InvalidCredentialsException() {
            super("用户名或密码错误");
        }
    }
}
