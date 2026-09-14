package com.exe101.exe.dto.response;

public record WalletResponse(
        Integer currentPoints,
        Integer totalEarnedPoints,
        Integer totalSpentPoints
) {
}
