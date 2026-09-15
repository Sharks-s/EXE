package com.exe101.exe.security;

import lombok.experimental.UtilityClass;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@UtilityClass
public class MomoSignatureUtil {

    private static final String HMAC_SHA256 = "HmacSHA256";

    public static String hmacSha256(String data, String secretKey) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec keySpec = new SecretKeySpec(
                    secretKey.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(keySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Không thể tạo chữ ký HMAC-SHA256", e);
        }
    }

    public static boolean isValidSignature(String expected, String actual) {
        if (expected == null || actual == null) return false;
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8));
    }

    // Thứ tự field BẮT BUỘC theo tài liệu MoMo, không được đổi
    public static String buildCreateRawSignature(
            String accessKey, long amount, String extraData, String ipnUrl,
            String orderId, String orderInfo, String partnerCode,
            String redirectUrl, String requestId, String requestType
    ) {
        return "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=" + requestType;
    }

    // Thứ tự field dùng để VERIFY IPN, khác với lúc tạo request, cũng bắt buộc
    public static String buildIpnRawSignature(
            String accessKey, long amount, String extraData, String message,
            String orderId, String orderInfo, String orderType, String partnerCode,
            String payType, String requestId, long responseTime,
            int resultCode, long transId
    ) {
        return "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&message=" + message
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&orderType=" + orderType
                + "&partnerCode=" + partnerCode
                + "&payType=" + payType
                + "&requestId=" + requestId
                + "&responseTime=" + responseTime
                + "&resultCode=" + resultCode
                + "&transId=" + transId;
    }

    // Thứ tự field theo tài liệu MoMo cho API Check Transaction Status
    public static String buildQueryRawSignature(
            String accessKey, String orderId, String partnerCode, String requestId
    ) {
        return "accessKey=" + accessKey
                + "&orderId=" + orderId
                + "&partnerCode=" + partnerCode
                + "&requestId=" + requestId;
    }
}