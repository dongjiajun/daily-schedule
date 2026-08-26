package com.dailyschedule.api.exception;

import com.dailyschedule.api.generated.dto.ModelApiResponse;
import com.dailyschedule.application.auth.AuthApplicationService.DuplicateAccountException;
import com.dailyschedule.application.auth.AuthApplicationService.InvalidCredentialsException;
import com.dailyschedule.infrastructure.wechat.WechatApiException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.dao.DuplicateKeyException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @AfterEach
    void clearMdc() {
        MDC.clear();
    }

    @Test
    @DisplayName("ResourceNotFoundException → 404")
    void resourceNotFound_maps404() {
        ModelApiResponse resp = handler.handleNotFound(new ResourceNotFoundException("分类不存在: 1"));
        assertThat(resp.getCode()).isEqualTo(404);
        assertThat(resp.getMessage()).isEqualTo("分类不存在: 1");
    }

    @Test
    @DisplayName("BusinessException → 409（重复创建宠物）")
    void businessConflict_maps409() {
        ModelApiResponse resp = handler.handleBusinessConflict(new BusinessException("已有宠物，不可重复创建"));
        assertThat(resp.getCode()).isEqualTo(409);
        assertThat(resp.getMessage()).isEqualTo("已有宠物，不可重复创建");
    }

    @Test
    @DisplayName("InvalidCredentialsException → 401")
    void invalidCredentials_maps401() {
        ModelApiResponse resp = handler.handleInvalidCredentials(new InvalidCredentialsException());
        assertThat(resp.getCode()).isEqualTo(401);
    }

    @Test
    @DisplayName("DuplicateKeyException → 409")
    void duplicateKey_maps409() {
        ModelApiResponse resp = handler.handleConflict(new DuplicateKeyException("dup"));
        assertThat(resp.getCode()).isEqualTo(409);
        assertThat(resp.getMessage()).isEqualTo("资源已存在");
    }

    @Test
    @DisplayName("IllegalArgumentException → 400")
    void illegalArgument_maps400() {
        ModelApiResponse resp = handler.handleIllegalArgument(new IllegalArgumentException("名称不能为空"));
        assertThat(resp.getCode()).isEqualTo(400);
        assertThat(resp.getMessage()).isEqualTo("名称不能为空");
    }

    @Test
    @DisplayName("WechatApiException 40029（code 无效）→ HTTP 400 + body 400")
    void wechatInvalidCode_maps400() {
        var resp = handler.handleWechat(
            new WechatApiException(WechatApiException.ERR_INVALID_CODE, "登录凭证无效或已过期"));
        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        assertThat(resp.getBody()).isNotNull();
        assertThat(resp.getBody().getCode()).isEqualTo(400);
        assertThat(resp.getBody().getMessage()).isEqualTo("登录凭证无效或已过期");
    }

    @Test
    @DisplayName("WechatApiException 其他 errcode → HTTP 502 + body 502")
    void wechatUpstreamError_maps502() {
        var resp = handler.handleWechat(
            new WechatApiException(40125, "微信登录服务错误"));
        assertThat(resp.getStatusCode().value()).isEqualTo(502);
        assertThat(resp.getBody()).isNotNull();
        assertThat(resp.getBody().getCode()).isEqualTo(502);
    }

    @Test
    @DisplayName("WechatApiException 网络异常（errcode -1）→ HTTP 502 + body 502")
    void wechatNetworkError_maps502() {
        var resp = handler.handleWechat(
            new WechatApiException(WechatApiException.ERR_NETWORK, "微信服务暂不可用"));
        assertThat(resp.getStatusCode().value()).isEqualTo(502);
        assertThat(resp.getBody()).isNotNull();
        assertThat(resp.getBody().getCode()).isEqualTo(502);
    }

    @Test
    @DisplayName("单一兜底：RuntimeException → 500 且 message 收敛")
    void runtimeException_maps500() {
        ModelApiResponse resp = handler.handleUnexpected(new RuntimeException("boom"));
        assertThat(resp.getCode()).isEqualTo(500);
        assertThat(resp.getMessage()).isEqualTo("服务器内部错误");
    }

    @Test
    @DisplayName("单一兜底：checked Exception → 500")
    void checkedException_maps500() {
        ModelApiResponse resp = handler.handleUnexpected(new Exception("checked boom"));
        assertThat(resp.getCode()).isEqualTo(500);
        assertThat(resp.getMessage()).isEqualTo("服务器内部错误");
    }

    @Test
    @DisplayName("MDC 有 requestId → message 携带后缀")
    void message_carriesRequestId_whenMdcPresent() {
        MDC.put("requestId", "trace-42");
        ModelApiResponse resp = handler.handleNotFound(new ResourceNotFoundException("分类不存在: 1"));
        assertThat(resp.getMessage()).isEqualTo("分类不存在: 1（requestId: trace-42）");
    }

    @Test
    @DisplayName("MDC 无 requestId → message 原样（无空占位）")
    void message_withoutRequestId_whenMdcAbsent() {
        ModelApiResponse resp = handler.handleBusinessConflict(new BusinessException("商店中没有可用的食物"));
        assertThat(resp.getMessage()).isEqualTo("商店中没有可用的食物");
    }
}
