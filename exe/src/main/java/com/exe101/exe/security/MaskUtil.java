package com.exe101.exe.security;

import org.springframework.stereotype.Component;

@Component
public class MaskUtil {
    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "****@****";
        }

        String domain = email.substring(email.lastIndexOf("@") + 1);
        int dot = domain.lastIndexOf(".");

        if (dot > 0) {
            return "****@***" + domain.substring(dot);
        }
        return "****@****";
    }
}
