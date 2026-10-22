package com.amigocode.inventory_management_system.repository;

import com.amigocode.inventory_management_system.entity.Request;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestRepository extends JpaRepository<Request, Long> {
}