package com.exe101.exe.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.sepay")
@Getter
@Setter
public class SePayProperties {

    private String merchantId;
    private String secretKey;
    private String checkoutUrl;
    private String apiBaseUrl;
    private String successUrl;
    private String errorUrl;
    private String cancelUrl;
    private String backendBaseUrl;
}
