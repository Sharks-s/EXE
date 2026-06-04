package com.exe101.exe.security;

import com.exe101.exe.config.AppCorsProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@RequiredArgsConstructor
public class CorsConfig {
    private final AppCorsProperties appCorsProperties;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowedOrigins(appCorsProperties.getAllowedOrigins());
        corsConfiguration.setAllowedMethods(appCorsProperties.getAllowedMethods());
        corsConfiguration.setAllowedHeaders(appCorsProperties.getAllowedHeaders());
        corsConfiguration.setAllowCredentials(appCorsProperties.getAllowCredentials());
        corsConfiguration.setMaxAge(appCorsProperties.getMaxAge());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);
        return source;
    }
}