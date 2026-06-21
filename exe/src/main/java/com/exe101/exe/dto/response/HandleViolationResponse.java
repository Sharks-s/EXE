package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.ViolationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HandleViolationResponse {
    private FocusSessionResponse focusSessionResponse;
    private boolean isPenalty;     // true nếu lần này có trừ potentialReward/accumulatedReward
    private ViolationType type;    // loại vi phạm/nhắc nhở vừa ghi nhận
}