package com.exe101.exe.mapper;

import com.exe101.exe.dto.response.SongResponse;
import com.exe101.exe.model.entity.Song;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SongMapper {
    SongResponse toResponse(Song song);
}