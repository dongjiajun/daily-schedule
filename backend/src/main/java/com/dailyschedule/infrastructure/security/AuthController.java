package com.dailyschedule.infrastructure.security;

import com.dailyschedule.domain.category.Category;
import com.dailyschedule.domain.category.CategoryRepository;
import com.dailyschedule.domain.user.User;
import com.dailyschedule.domain.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private static final List<String[]> DEFAULT_CATEGORIES = List.of(
        new String[]{"工作", "#3b82f6", "工作相关日程"},
        new String[]{"个人", "#10b981", "个人事务与生活"},
        new String[]{"学习", "#f59e0b", "学习与自我提升"},
        new String[]{"健康", "#ef4444", "运动与健康管理"},
        new String[]{"社交", "#8b5cf6", "聚会、活动与社交"},
        new String[]{"旅行", "#06b6d4", "出行与旅游计划"}
    );

    public AuthController(UserRepository userRepository, CategoryRepository categoryRepository,
                          PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("用户名和密码不能为空");
        }
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("用户名已存在");
        }
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);

        for (String[] cat : DEFAULT_CATEGORIES) {
            Category category = new Category(cat[0], cat[1]);
            category.setDescription(cat[2]);
            category.setUserId(user.getId());
            categoryRepository.save(category);
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        return Map.of("token", token, "userId", user.getId(), "username", user.getUsername());
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        if (username == null || password == null) {
            throw new IllegalArgumentException("用户名和密码不能为空");
        }
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("用户名或密码错误"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("用户名或密码错误");
        }
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        return Map.of("token", token, "userId", user.getId(), "username", user.getUsername());
    }
}
