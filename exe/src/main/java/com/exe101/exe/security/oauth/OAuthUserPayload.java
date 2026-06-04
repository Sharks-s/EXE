package com.exe101.exe.security.oauth;

import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Map;

public record OAuthUserPayload(
        String providerId,
        String email,
        String name,
        String avatar
) {

    // ===== GOOGLE (OIDC) =====
    public static OAuthUserPayload fromOidc(OidcUser user) {
        return new OAuthUserPayload(
                user.getSubject(),
                user.getEmail(),
                user.getFullName(),
                user.getPicture()
        );
    }

    // ===== FACEBOOK
    public static OAuthUserPayload fromOAuth2(OAuth2User user) {
        Map<String, Object> attr = user.getAttributes();

        return new OAuthUserPayload(
                (String) attr.get("id"),
                (String) attr.get("email"),
                (String) attr.get("name"),
                (String) attr.get("picture")
        );
    }
}