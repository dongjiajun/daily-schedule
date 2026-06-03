package com.dailyschedule.domain.user;

public enum UserStatus {
    /** 正常用户 */
    ACTIVE,
    /** 已禁用（管理员封禁等） */
    DISABLED,
    /** 软删除 */
    DELETED,
    /** 系统占位用户（如 legacy 用户承接历史数据，不允许登录） */
    SYSTEM
}
