package com.exe101.exe.dto.response;

import lombok.*;

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
    private boolean profileCompleted;
    private Long personalityId;
    private String personalityCode;
    private List<String> roles;
}
