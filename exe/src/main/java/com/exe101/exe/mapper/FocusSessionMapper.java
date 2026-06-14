package com.exe101.exe.mapper;

import com.exe101.exe.dto.response.FocusSessionResponse;
import com.exe101.exe.model.entity.FocusSession;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FocusSessionMapper {

    @Mapping(source = "userPet.id", target = "userPetId")
    @Mapping(source = "personality.id", target = "personalityId")
    FocusSessionResponse toResponse(FocusSession session);
}
