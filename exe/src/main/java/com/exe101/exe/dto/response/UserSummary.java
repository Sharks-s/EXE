package com.exe101.exe.dto.response;

import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserSummary {
    private Long id;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String addressLine;
    private Integer provinceCode;
    private String provinceName;
    private Integer wardCode;
    private String wardName;
    private Instant createdAt;

    private Instant passwordUpdatedAt;
    private boolean profileCompleted;
    private String aiSelfAddress;
    private String aiUserAddress;
    private boolean onboardingCompleted;
    private Long personalityId;
    private String personalityCode;
    private List<String> roles;
    private String preferredLanguage;
}
