package com.exe101.exe.security.oauth;

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

import java.io.IOException;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {

        // 1. Ép kiểu về OAuth2User chung để bốc mảng Attributes gốc của nhà mạng
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oauth2User.getAttributes();

        // 2. Tạm thời dự án mới chạy Google, ấn định luôn Provider là GOOGLE
        AuthProvider provider = AuthProvider.GOOGLE;

        // 3. ĐƯA FACTORY VÀO TRẬN: Bốc đúng bộ dịch GoogleOAuth2UserInfo để chuẩn hóa dữ liệu
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.get(provider, attributes);

        // 4. Đóng gói dữ liệu sạch sẽ vào Record Payload để ném xuống Service xử lý DB
        OAuthUserPayload payload = new OAuthUserPayload(
                userInfo.getProviderId(),
                userInfo.getEmail(),
                userInfo.getName(),
                userInfo.getAvatarUrl()
        );

        log.info("OAuth2 login successful for email: {}", payload.email());

        // 5. Gọi Service tạo tài khoản ngầm hoặc map tài khoản cũ, nhận về Access/Refresh Token
        OAuthLoginResult result = authService.processOAuthLogin(provider, payload);

        // 6. Đút Refresh Token vào HttpOnly Cookie gửi về cho Client (Tauri sẽ tự ôm lấy)
        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookieUtil.createRefreshCookie(result.getRefreshToken()).toString()
        );

        // 7. Redirect về luồng xử lý của Frontend (Sau này làm Deep Link hoặc Web tĩnh trung gian)
        response.sendRedirect("http://localhost:5173/oauth2/success");
    }
}
