package com.exe101.exe.model.enums;

import java.util.Arrays;

public enum AuthProvider {
    LOCAL,
    GOOGLE,
    FACEBOOK;

    public static AuthProvider from(String registrationId) {
        return Arrays.stream(values())
                .filter(p -> p.name().equalsIgnoreCase(registrationId))
                .findFirst()
                .orElseThrow(() ->
                        new IllegalArgumentException("Unsupported OAuth provider: " + registrationId)
                );
    }
}
