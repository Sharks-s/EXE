package com.exe101.exe.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.mail")
@Getter
@Setter
public class MailProperties {
    private String from;
    private String fromName;
    private String apiKey;
    private String baseUrl;
    private String testRecipient;
}
