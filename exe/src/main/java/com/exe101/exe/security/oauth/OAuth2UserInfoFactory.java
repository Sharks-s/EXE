package com.exe101.exe.security.oauth;

import com.exe101.exe.model.enums.AuthProvider;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public final class OAuth2UserInfoFactory {

    private OAuth2UserInfoFactory() {}

    public static OAuth2UserInfo get(
            AuthProvider provider,
            Map<String, Object> attributes
    ) {
        return switch (provider) {
            case GOOGLE -> new GoogleOAuth2UserInfo(attributes);
            default -> throw new IllegalArgumentException(
                    "Unsupported OAuth provider: " + provider
            );
        };
    }
}

