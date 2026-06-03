package com.dailyschedule.domain.user;

/**
 * 密码哈希端口（领域层）。
 * <p>basement 由 infrastructure 层实现（默认基于 Spring Security 的 BCrypt）。</p>
 */
public interface PasswordHasher {

    /** 对明文密码哈希；返回值可直接存入 user.password_hash。 */
    String hash(String rawPassword);

    /** 校验明文密码与已有哈希是否匹配。 */
    boolean matches(String rawPassword, String hashed);
}
