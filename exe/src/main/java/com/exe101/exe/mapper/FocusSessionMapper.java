package com.exe101.exe.mapper;

import com.exe101.exe.dto.response.FocusSessionResponse;
import com.exe101.exe.model.entity.FocusSession;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FocusSessionMapper {

    @Mapping(source = "user.id", target = "userId")
    FocusSessionResponse toResponse(FocusSession session);
}
