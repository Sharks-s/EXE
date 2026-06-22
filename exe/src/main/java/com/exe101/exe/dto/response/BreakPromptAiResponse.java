package com.exe101.exe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BreakPromptAiResponse {
    private String aiSpeech;
    private List<AiBubbleAction> actions;
}
