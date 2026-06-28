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
    @Mapping(target = "personalityId", source = "personality.id")
    @Mapping(target = "personalityCode", source = "personality.code")
    @Mapping(target = "provinceCode", source = "province.code")
    @Mapping(target = "provinceName", source = "province.name")
    @Mapping(target = "wardCode", source = "ward.code")
    @Mapping(target = "wardName", source = "ward.name")
    @Mapping(
            target = "passwordUpdatedAt",
            expression = "java(user.getIdentities().stream()" +
                    ".filter(identity -> identity.getProvider() == com.exe101.exe.model.enums.AuthProvider.LOCAL)" +
                    ".findFirst()" +
                    ".map(com.exe101.exe.model.entity.UserIdentity::getPasswordUpdatedAt)" +
                    ".orElse(null))"
    )

    UserSummary toSummary(User user);

    UserResponse toResponse(User user);

    default Instant map(Instant value) {
        return value == null
                ? null
                : value.atZone(ZoneOffset.UTC).toInstant();
    }
}

