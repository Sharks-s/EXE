package com.exe101.exe.config;

import com.exe101.exe.model.entity.Role;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserIdentity;
import com.exe101.exe.model.entity.UserRole;
import com.exe101.exe.model.enums.AuthProvider;
import com.exe101.exe.model.enums.UserStatus;
import com.exe101.exe.repository.*;
import com.exe101.exe.security.SecurityConfig;

import com.exe101.exe.service.PersonalityService;
import com.exe101.exe.service.PetService;
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

    @Override
    @Transactional
    public void run(String... args) throws Exception {
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
                                .fullName("Admin")
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
                                .build()
                ));

        //--------Assign ADMIN role-----------
        boolean adminRoleAssigned = userRoleRepository.existsByUserAndRole(adminUser, adminRole);

        if (!adminRoleAssigned) {
            userRoleRepository.save(UserRole.builder()
                    .user(adminUser)
                    .role(adminRole)
                    .assignedAt(Instant.now())
                    .assignedBy(null)
                    .active(true)
                    .build());
        }

        //--------Init default personalities-----------
        personalityService.seedDefaultPersonalities();
        //--------Init default pets-----------
        petService.seedDefaultPets();
    }
}

