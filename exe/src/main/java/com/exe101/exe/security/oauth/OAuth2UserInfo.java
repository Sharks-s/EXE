package com.exe101.exe.security.oauth;


public interface OAuth2UserInfo {
    String getProviderId();
    String getEmail();
    String getName();
    String getAvatarUrl();
}