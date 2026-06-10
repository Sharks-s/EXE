package com.exe101.exe.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "app.seed")
@Getter
@Setter
public class AppSeedProperties {

    private List<PersonalitySeed> personalities;

    @Getter
    @Setter
    public static class PersonalitySeed {
        private String code;
        private String name;
        private String description;
        private boolean premium;
    }
}