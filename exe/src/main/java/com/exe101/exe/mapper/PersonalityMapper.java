package com.exe101.exe.mapper;

import com.exe101.exe.dto.response.PersonalityResponse;
import com.exe101.exe.model.entity.Personality;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PersonalityMapper {
    PersonalityResponse toResponse(Personality personality);
}
