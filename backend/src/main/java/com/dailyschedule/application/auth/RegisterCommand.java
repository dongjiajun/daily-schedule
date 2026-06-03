package com.dailyschedule.application.auth;

public record RegisterCommand(String username,
                              String email,
                              String password,
                              String displayName) {
}
