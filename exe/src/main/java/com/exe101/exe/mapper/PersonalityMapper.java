package com.exe101.exe.mapper;

import com.exe101.exe.dto.response.PersonalityResponse;
import com.exe101.exe.model.entity.Personality;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PersonalityMapper {
    @Mapping(source = "premium", target = "isPremium")
    PersonalityResponse toResponse(Personality personality);
}
