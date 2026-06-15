package com.exe101.exe.dto.response;

import lombok.*;

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
    private boolean profileCompleted;
    private Long personalityId;
    private String personalityCode;
    private List<String> roles;
}
