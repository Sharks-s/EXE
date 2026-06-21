package com.exe101.exe.dto.response;

import java.util.Set;

public record AppRulesResponse(
        Set<String> blacklist,
        Set<String> whitelist
) {}
