package com.exe101.exe.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class ProfileCompletionResponse {
    private boolean profileCompleted;
    private boolean required;
    private List<String> requiredFields;
    private UserSummary user;
}
