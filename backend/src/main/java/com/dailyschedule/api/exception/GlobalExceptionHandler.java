package com.dailyschedule.api.exception;

import com.dailyschedule.api.generated.dto.ModelApiResponse;
import com.dailyschedule.application.auth.AuthApplicationService.DuplicateAccountException;
import com.dailyschedule.application.auth.AuthApplicationService.InvalidCredentialsException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
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

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ModelApiResponse handleNotFound(ResourceNotFoundException ex) {
        log.warn("资源不存在: {}", ex.getMessage());
        ModelApiResponse resp = new ModelApiResponse();
        resp.setCode(404);
        resp.setMessage(ex.getMessage());
        return resp;
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ModelApiResponse handleInvalidCredentials(InvalidCredentialsException ex) {
        log.warn("认证失败: {}", ex.getMessage());
        ModelApiResponse resp = new ModelApiResponse();
        resp.setCode(401);
        resp.setMessage(ex.getMessage());
        return resp;
    }

    @ExceptionHandler({DuplicateAccountException.class, DuplicateKeyException.class})
    @ResponseStatus(HttpStatus.CONFLICT)
    public ModelApiResponse handleConflict(Exception ex) {
        String msg = ex instanceof DuplicateAccountException ? ex.getMessage() : "资源已存在";
        log.warn("资源冲突: {}", msg);
        ModelApiResponse resp = new ModelApiResponse();
        resp.setCode(409);
        resp.setMessage(msg);
        return resp;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ModelApiResponse handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("参数校验失败: {}", ex.getMessage());
        ModelApiResponse resp = new ModelApiResponse();
        resp.setCode(400);
        resp.setMessage(ex.getMessage());
        return resp;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ModelApiResponse handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .reduce((a, b) -> a + "; " + b)
            .orElse("请求参数不合法");
        log.warn("请求体校验失败: {}", msg);
        ModelApiResponse resp = new ModelApiResponse();
        resp.setCode(400);
        resp.setMessage(msg);
        return resp;
    }

    @ExceptionHandler({MissingServletRequestParameterException.class,
                       MethodArgumentTypeMismatchException.class,
                       HttpMessageNotReadableException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ModelApiResponse handleBadRequest(Exception ex) {
        log.warn("请求格式错误: {}", ex.getMessage());
        ModelApiResponse resp = new ModelApiResponse();
        resp.setCode(400);
        resp.setMessage(ex.getMessage());
        return resp;
    }

    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ModelApiResponse handleRuntime(RuntimeException ex) {
        log.error("运行时异常", ex);
        ModelApiResponse resp = new ModelApiResponse();
        resp.setCode(500);
        resp.setMessage("服务器内部错误");
        return resp;
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ModelApiResponse handleGeneral(Exception ex) {
        log.error("未知异常", ex);
        ModelApiResponse resp = new ModelApiResponse();
        resp.setCode(500);
        resp.setMessage("服务器内部错误");
        return resp;
    }
}
