package com.amigocode.inventory_management_system.repository;

import com.amigocode.inventory_management_system.entity.RequestItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequestItemRepository extends JpaRepository<RequestItem, Long> {
    List<RequestItem> findByAsset_Id(Long assetId);
}