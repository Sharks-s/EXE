package com.exe101.exe.security.oauth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

/**
 * Thêm prompt=select_account và nhét tauri_callback_port (nếu hợp lệ) vào state.
 * Google trả nguyên state về callback nên Success/Failure handler đọc lại được port.
 */
public class TauriAwareAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final DefaultOAuth2AuthorizationRequestResolver delegate;

    public TauriAwareAuthorizationRequestResolver(
            ClientRegistrationRepository repo, String baseUri) {
        this.delegate = new DefaultOAuth2AuthorizationRequestResolver(repo, baseUri);
        this.delegate.setAuthorizationRequestCustomizer(c ->
                c.additionalParameters(p -> p.put("prompt", "select_account")));
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        return withPort(delegate.resolve(request), request);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        return withPort(delegate.resolve(request, clientRegistrationId), request);
    }

    private OAuth2AuthorizationRequest withPort(OAuth2AuthorizationRequest req, HttpServletRequest http) {
        if (req == null) return null;
        Integer port = OAuthStateUtil.parsePort(http.getParameter("tauri_callback_port"));
        if (port == null) return req;
        return OAuth2AuthorizationRequest.from(req)
                .state(OAuthStateUtil.encode(req.getState(), port))
                .build();
    }
}