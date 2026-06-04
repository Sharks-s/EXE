package com.exe101.exe.security.oauth;

import java.util.Map;

public record GoogleOAuth2UserInfo(
        Map<String, Object> attributes
) implements OAuth2UserInfo {

    @Override
    public String getProviderId() {
        return (String) attributes.get("sub");
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public String getName() {
        return (String) attributes.get("name");
    }

    @Override
    public String getAvatarUrl() {
        return (String) attributes.get("picture");
    }
}
