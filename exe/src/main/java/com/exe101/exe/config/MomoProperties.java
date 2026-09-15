package com.exe101.exe.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.momo")
@Getter
@Setter
public class MomoProperties {

    /** Cấp bởi MoMo, sandbox dùng giá trị test public */
    private String partnerCode;
    private String accessKey;
    private String secretKey;

    /** Endpoint tạo payment, đổi sang payment.momo.vn khi lên prod */
    private String endpoint;

    /** URL MoMo redirect user về sau khi thanh toán (FE/deep link xử lý hiển thị) */
    private String redirectUrl;

    /** URL MoMo gọi server-to-server để xác nhận kết quả thật (nguồn sự thật duy nhất) */
    private String ipnUrl;

    /** payWithMethod | payWithATM | payWithCC ... */
    private String requestType;

    /** captureWallet mặc định cho payWithMethod */
    private String partnerName;
    private String storeId;

    /** Endpoint để hỏi lại trạng thái giao dịch (reconciliation) */
    private String queryEndpoint;
}