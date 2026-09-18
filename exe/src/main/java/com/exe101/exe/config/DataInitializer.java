package com.exe101.exe.config;

import com.exe101.exe.model.entity.Role;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserIdentity;
import com.exe101.exe.model.entity.UserRole;
import com.exe101.exe.model.enums.AuthProvider;
import com.exe101.exe.model.enums.UserStatus;
import com.exe101.exe.repository.*;
import com.exe101.exe.security.SecurityConfig;

import com.exe101.exe.service.AppRuleService;
import com.exe101.exe.service.AchievementService;
import com.exe101.exe.service.AppSettingService;
import com.exe101.exe.service.PersonalityService;
import com.exe101.exe.service.PetService;
import com.exe101.exe.service.PromptTemplateService;
import com.exe101.exe.service.SubscriptionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;


@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    @Value("${ADMIN_EMAIL}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD}")
    private String adminPassword;

    private final UserRepository userRepository;
    private final SecurityConfig securityConfig;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserIdentityRepository userIdentityRepository;
    private final PersonalityService personalityService;
    private final PetService petService;
    private final AppRuleService appRuleService;
    private final PromptTemplateService promptTemplateService;
    private final SubscriptionService subscriptionService;
    private final AchievementService achievementService;
    private final AppSettingService appSettingService;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        //--------Role SUPER_ADMIN-----------
        Role superAdminRole = roleRepository.findByCode("SUPER_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .code("SUPER_ADMIN")
                        .name("Super Administrator")
                        .description("Highest authority system owner")
                        .system(true)
                        .active(true)
                        .createdBy(null)
                        .build()));
        //--------Role ADMIN-----------
        Role adminRole = roleRepository.findByCode("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .code("ADMIN")
                        .name("Administrator")
                        .description("System administrator")
                        .system(true)
                        .active(true)
                        .createdBy(null)
                        .build()));

        //--------Role USER-----------
        Role userRole = roleRepository.findByCode("USER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .code("USER")
                        .name("User")
                        .description("System user")
                        .system(true)
                        .active(true)
                        .createdBy(null)
                        .build())
                );
        //--------Admin account-----------
        User adminUser = userRepository.findByEmail(adminEmail)
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .email(adminEmail)
                                .fullName("Super Admin")
                                .status(UserStatus.ACTIVE)
                                .profileCompleted(true)
                                .build()
                ));

        userIdentityRepository.findByUserAndProvider(adminUser, AuthProvider.LOCAL)
                .orElseGet(() -> userIdentityRepository.save(
                        UserIdentity.builder()
                                .user(adminUser)
                                .provider(AuthProvider.LOCAL)
                                .password(securityConfig.passwordEncoder().encode(adminPassword))
                                .passwordUpdatedAt(Instant.now())
                                .build()
                ));

        //--------Assign ADMIN role-----------
        boolean superAdminRoleAssigned = userRoleRepository.existsByUserAndRole(adminUser, superAdminRole);

        if (!superAdminRoleAssigned) {
            userRoleRepository.save(UserRole.builder()
                    .user(adminUser)
                    .role(superAdminRole)
                    .assignedAt(Instant.now())
                    .assignedBy(null)
                    .active(true)
                    .build());
        }

        //--------Init default personalities-----------
        personalityService.seedDefaultPersonalities();
        //--------Init default pets-----------
        petService.seedDefaultPets();
        //--------Init default app rules-----------
        appRuleService.seedDefaultAppRules();
        //--------Init default prompt templates-----------
        promptTemplateService.seedDefaultPromptTemplates();
        //--------Init default subscription plans-----------
        subscriptionService.seedDefaultSubscriptionPlans();
        //--------Init default achievements-----------
        achievementService.seedDefaultAchievements();
        //--------Init runtime app settings-----------
        appSettingService.seedDefaultSettings();

    }
}

