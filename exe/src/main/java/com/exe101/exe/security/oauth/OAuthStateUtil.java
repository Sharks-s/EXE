package com.exe101.exe.security.oauth;

/** Encode/decode port của Tauri vào tham số state của OAuth2 (dạng "<state>.<port>"). */
public final class OAuthStateUtil {

    private static final int MIN_PORT = 1025;
    private static final int MAX_PORT = 65534;

    private OAuthStateUtil() {}

    /** Chỉ nhận chuỗi toàn chữ số, trong khoảng 1025-65534. Không hợp lệ -> null. */
    public static Integer parsePort(String raw) {
        if (raw == null || !raw.matches("\\d{4,5}")) return null;
        int port = Integer.parseInt(raw);
        return (port >= MIN_PORT && port <= MAX_PORT) ? port : null;
    }

    public static String encode(String state, int port) {
        return state + "." + port;
    }

    public static Integer extractPort(String state) {
        if (state == null) return null;
        int idx = state.lastIndexOf('.');
        if (idx < 0) return null;
        return parsePort(state.substring(idx + 1));
    }
}