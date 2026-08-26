package com.dailyschedule.api.exception;

import com.dailyschedule.api.generated.dto.ModelApiResponse;
import com.dailyschedule.application.auth.AuthApplicationService.DuplicateAccountException;
import com.dailyschedule.application.auth.AuthApplicationService.InvalidCredentialsException;
import com.dailyschedule.infrastructure.wechat.WechatApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String MDC_REQUEST_ID = "requestId";

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ModelApiResponse handleNotFound(ResourceNotFoundException ex) {
        log.warn("资源不存在: {}", ex.getMessage());
        return buildResponse(404, ex.getMessage());
    }

    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ModelApiResponse handleBusinessConflict(BusinessException ex) {
        log.warn("业务冲突: {}", ex.getMessage());
        return buildResponse(409, ex.getMessage());
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ModelApiResponse handleInvalidCredentials(InvalidCredentialsException ex) {
        log.warn("认证失败: {}", ex.getMessage());
        return buildResponse(401, ex.getMessage());
    }

    @ExceptionHandler({DuplicateAccountException.class, DuplicateKeyException.class})
    @ResponseStatus(HttpStatus.CONFLICT)
    public ModelApiResponse handleConflict(Exception ex) {
        String msg = ex instanceof DuplicateAccountException ? ex.getMessage() : "资源已存在";
        log.warn("资源冲突: {}", msg);
        return buildResponse(409, msg);
    }

    /**
     * 微信 API 错误：40029（code 无效，客户端语义）→ HTTP 400；其余 → HTTP 502（上游服务错误）。
     * 两种状态码动态返回，故用 ResponseEntity 而非 @ResponseStatus。
     */
    @ExceptionHandler(WechatApiException.class)
    public ResponseEntity<ModelApiResponse> handleWechat(WechatApiException ex) {
        if (ex.isInvalidCode()) {
            log.warn("微信登录凭证无效: errcode={}", ex.getErrcode());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildResponse(400, ex.getMessage()));
        }
        log.error("微信登录上游错误: errcode={}", ex.getErrcode());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .body(buildResponse(502, ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ModelApiResponse handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("参数校验失败: {}", ex.getMessage());
        return buildResponse(400, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ModelApiResponse handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .reduce((a, b) -> a + "; " + b)
            .orElse("请求参数不合法");
        log.warn("请求体校验失败: {}", msg);
        return buildResponse(400, msg);
    }

    @ExceptionHandler({MissingServletRequestParameterException.class,
                       MethodArgumentTypeMismatchException.class,
                       HttpMessageNotReadableException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ModelApiResponse handleBadRequest(Exception ex) {
        log.warn("请求格式错误: {}", ex.getMessage());
        return buildResponse(400, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ModelApiResponse handleUnexpected(Exception ex) {
        log.error("未预期异常", ex);
        return buildResponse(500, "服务器内部错误");
    }

    /** 统一响应构造：message 携带 requestId（MDC 有值时），用户凭响应即可定位日志。 */
    private ModelApiResponse buildResponse(int code, String message) {
        ModelApiResponse resp = new ModelApiResponse();
        resp.setCode(code);
        resp.setMessage(withRequestId(message));
        return resp;
    }

    private String withRequestId(String message) {
        String requestId = MDC.get(MDC_REQUEST_ID);
        return requestId != null ? message + "（requestId: " + requestId + "）" : message;
    }
}
