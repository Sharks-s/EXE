package com.exe101.exe.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.otp")
@Getter
@Setter
public class OtpProperties {
    private int expireMinutes;
    private int length;
    private int maxAttempts;
}