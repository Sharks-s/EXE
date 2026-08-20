package com.exe101.exe.service;

import java.util.Map;

public interface PromptTemplateService {
    String render(String promptKey, Map<String, String> values);
    String renderWithPersona(String taskPromptKey, Map<String, String> values); // ghép PERSONA_HEADER + task
    void seedDefaultPromptTemplates();
}