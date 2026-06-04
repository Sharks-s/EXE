package com.exe101.exe.dto.response;

import java.util.List;

public record PagedResponse<T>(
        List<T> items,
        int currentPage,
        long totalItems,
        int totalPages,
        boolean hasNext
) {}
