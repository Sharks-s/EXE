package com.exe101.exe.repository;

import com.exe101.exe.model.entity.Ward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WardRepository extends JpaRepository<Ward, Integer> {

    List<Ward> findByProvinceCodeOrderByNameAsc(Integer provinceCode);
}
