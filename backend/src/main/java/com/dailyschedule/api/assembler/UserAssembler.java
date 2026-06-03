package com.dailyschedule.api.assembler;

import com.dailyschedule.api.generated.dto.LoginResponse;
import com.dailyschedule.api.generated.dto.UserResponse;
import com.dailyschedule.application.auth.Tokens;
import com.dailyschedule.domain.user.User;

public class UserAssembler {

    public static UserResponse toResponse(User u) {
        UserResponse resp = new UserResponse();
        resp.setId(u.getId());
        resp.setUsername(u.getUsername());
        resp.setEmail(u.getEmail());
        resp.setDisplayName(u.getDisplayName());
        resp.setAvatarUrl(u.getAvatarUrl());
        resp.setCreatedAt(u.getCreatedAt());
        return resp;
    }

    public static LoginResponse toLoginResponse(Tokens tokens) {
        LoginResponse resp = new LoginResponse();
        resp.setAccessToken(tokens.accessToken());
        resp.setRefreshToken(tokens.refreshToken());
        resp.setExpiresIn((int) tokens.expiresIn());
        resp.setUser(toResponse(tokens.user()));
        return resp;
    }
}
