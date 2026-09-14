package com.exe101.exe.config;

import com.exe101.exe.model.enums.RuleType;
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
    private List<PetSeed> pets;
    private List<AppRuleSeed> appRules;
    private List<SubscriptionPlanSeed> subscriptionPlans;
    private String defaultPetCode;
    private String defaultPersonalityCode;
    private Integer dailyFreeUsage;
    private Integer defaultCycleMinutes;

    @Getter
    @Setter
    public static class PersonalitySeed {
        private String code;
        private String name;
        private String description;
        private boolean premium;
    }

    @Getter
    @Setter
    public static class PetSeed {
        private String code;
        private String name;
        private String description;
        private boolean premium;
        private String imageUrl;
    }

    @Getter
    @Setter
    public static class AppRuleSeed {
        private String appName;
        private String windowTitleKeyword;
        private RuleType ruleType;
    }

    @Getter
    @Setter
    public static class SubscriptionPlanSeed {
        private String code;
        private String name;
        private String description;
        private String plan;
        private String billingCycle;
        private Integer priceVnd;
        private Integer durationDays;
        private Integer dailyLimitMinutes;
        private boolean unlimitedUsage;
        private boolean active;
        private Integer displayOrder;
    }

    public String getPetDescription(String code) {
        if (pets == null) return "";
        return pets.stream()
                .filter(p -> p.getCode().equalsIgnoreCase(code))
                .map(PetSeed::getDescription)
                .findFirst()
                .orElse("");
    }
}
