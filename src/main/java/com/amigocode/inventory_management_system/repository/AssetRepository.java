package com.amigocode.inventory_management_system.repository;

import com.amigocode.inventory_management_system.entity.Asset;
import com.amigocode.inventory_management_system.entity.AssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    List<Asset> findByAssetStatus(AssetStatus assetStatus);
}