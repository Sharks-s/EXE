package com.exe101.exe.security.oauth;

import com.exe101.exe.config.OAuth2Properties;
import com.exe101.exe.dto.response.OAuthLoginResult;
import com.exe101.exe.model.enums.AuthProvider;
import com.exe101.exe.security.CookieUtil;
import com.exe101.exe.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final CookieUtil cookieUtil;
    private final OAuth2Properties oauth2Properties;
    private final OAuthCodeStore codeStore;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {

        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oauth2User.getAttributes();

        AuthProvider provider = AuthProvider.GOOGLE;
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.get(provider, attributes);

        OAuthUserPayload payload = new OAuthUserPayload(
                userInfo.getProviderId(),
                userInfo.getEmail(),
                userInfo.getName(),
                userInfo.getAvatarUrl()
        );

        log.info("OAuth2 login successful for email: {}", payload.email());

        OAuthLoginResult result = authService.processOAuthLogin(provider, payload);

        Integer port = OAuthStateUtil.extractPort(request.getParameter("state"));

        if (port != null) {
            // Luồng Tauri: login diễn ra ở browser hệ thống -> KHÔNG set cookie ở đây.
            // Trả one-time code, webview sẽ gọi POST /auth/oauth/exchange để lấy token + cookie.
            String code = codeStore.issue(result.getRefreshToken());
            String url = UriComponentsBuilder.newInstance()
                    .scheme("http").host("localhost").port(port).path("/")
                    .queryParam("oauth_success", "true")
                    .queryParam("code", code)
                    .queryParam("isNewUser", result.isNewUser())
                    .build().toUriString();
            response.sendRedirect(url);
            return;
        }

        // Fallback (không có port): giữ hành vi cũ
        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookieUtil.createRefreshCookie(result.getRefreshToken()).toString()
        );
        response.sendRedirect(oauth2Properties.getDesktopRedirectUrl()
                + "?oauth_success=true&isNewUser=" + result.isNewUser());
    }
}