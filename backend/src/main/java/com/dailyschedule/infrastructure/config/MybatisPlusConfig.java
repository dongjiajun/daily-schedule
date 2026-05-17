package com.dailyschedule.infrastructure.config;

import org.springframework.context.annotation.Configuration;

/**
 * MyBatis-Plus 配置。
 * 分页通过 SQL LIMIT/OFFSET 手动实现，无需 PaginationInnerInterceptor。
 * 字段级配置（id 类型、下划线驼峰映射等）保留在 application.yml。
 */
@Configuration
public class MybatisPlusConfig {
}
