package com.dailyschedule.api.exception;

/**
 * 业务规则冲突异常——映射 HTTP 409（与资源冲突语义一致）。
 * 应用层用于表达"操作违反业务规则"（如重复创建、库存不足），
 * 与 {@link ResourceNotFoundException}（404）区分。
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
