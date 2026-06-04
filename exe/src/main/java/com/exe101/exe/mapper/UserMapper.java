package com.exe101.exe.mapper;

import com.exe101.exe.dto.response.UserResponse;
import com.exe101.exe.dto.response.UserSummary;
import com.exe101.exe.model.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.time.Instant;
import java.time.ZoneOffset;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(
            target = "roles",
            expression = "java(user.getUserRoles().stream()" +
                    ".filter(ur -> ur.isActive())" +
                    ".map(ur -> ur.getRole().getCode())" +
                    ".toList())"
    )
    UserSummary toSummary(User user);

    UserResponse toResponse(User user);

    default Instant map(Instant value) {
        return value == null
                ? null
                : value.atZone(ZoneOffset.UTC).toInstant();
    }
}

