package com.dailyschedule.infrastructure.security;

import com.dailyschedule.domain.user.PasswordHasher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 将 Spring Security 的 {@link PasswordEncoder} 适配为领域层 {@link PasswordHasher} 端口，
 * 让 application 层无需依赖 Spring Security 即可哈希与校验密码。
 */
@Component
public class PasswordHasherImpl implements PasswordHasher {

    private final PasswordEncoder passwordEncoder;

    public PasswordHasherImpl(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public String hash(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    @Override
    public boolean matches(String rawPassword, String hashed) {
        if (rawPassword == null || hashed == null) return false;
        return passwordEncoder.matches(rawPassword, hashed);
    }
}
