package com.exe101.exe.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "provinces")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Province {

    @Id
    private Integer code;

    private String name;

    private String codeName;

    @JsonIgnore
    @OneToMany(mappedBy = "province")
    private List<Ward> wards;
}
