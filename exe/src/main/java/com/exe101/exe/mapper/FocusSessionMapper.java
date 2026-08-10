package com.exe101.exe.mapper;

import com.exe101.exe.dto.response.FocusSessionResponse;
import com.exe101.exe.dto.response.ViolationResponse;
import com.exe101.exe.model.entity.FocusSession;
import com.exe101.exe.model.entity.Violation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface FocusSessionMapper {

    @Mapping(source = "userPet.id", target = "userPetId")
    @Mapping(source = "personality.id", target = "personalityId")
    @Mapping(source = "violations", target = "violations", qualifiedByName = "sortViolations")
    FocusSessionResponse toResponse(FocusSession session);

    ViolationResponse toViolationResponse(Violation violation);

    @org.mapstruct.Named("sortViolations")
    default List<ViolationResponse> sortViolations(Set<Violation> violations) {
        if (violations == null) return List.of();
        return violations.stream()
                .sorted(Comparator.comparing(Violation::getOccurredAt).reversed())
                .map(this::toViolationResponse)
                .collect(Collectors.toList());
    }
}
