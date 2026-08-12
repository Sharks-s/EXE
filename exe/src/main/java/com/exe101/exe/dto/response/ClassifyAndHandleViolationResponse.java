package com.exe101.exe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassifyAndHandleViolationResponse {
    private FocusSessionResponse focusSessionResponse;
    private boolean isViolation; // AI phán là vi phạm hay an toàn
    private String aiSpeech; // chỉ có ý nghĩa khi isViolation = true
    private int violationCount;
}