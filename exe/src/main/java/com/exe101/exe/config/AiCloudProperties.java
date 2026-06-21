package com.exe101.exe.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.ai-cloud")
public class AiCloudProperties {
    private String baseUrl;
    private String apiKey;
    private String model;
    private int timeoutSeconds;
}