package com.dailyschedule.api.exception;

import com.dailyschedule.api.generated.dto.ModelApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ModelApiResponse handleBadRequest(IllegalArgumentException ex) {
        ModelApiResponse resp = new ModelApiResponse();
        resp.setCode(400);
        resp.setMessage(ex.getMessage());
        return resp;
    }

    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ModelApiResponse handleNotFound(RuntimeException ex) {
        ModelApiResponse resp = new ModelApiResponse();
        resp.setCode(404);
        resp.setMessage(ex.getMessage());
        return resp;
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ModelApiResponse handleGeneral(Exception ex) {
        ModelApiResponse resp = new ModelApiResponse();
        resp.setCode(500);
        resp.setMessage("服务器内部错误");
        return resp;
    }
}
