package com.amigocode.inventory_management_system.service;

import com.amigocode.inventory_management_system.entity.Asset;
import com.amigocode.inventory_management_system.entity.AssetStatus;
import com.amigocode.inventory_management_system.repository.AssetRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssetService {

    private final AssetRepository assetRepository;

    public AssetService(AssetRepository assetRepository) {
        this.assetRepository = assetRepository;
    }

    public Asset createAsset(Asset asset) {
        return assetRepository.save(asset);
    }

    public List<Asset> getAllAssets() {
        return assetRepository.findAll();
    }

    public Asset getAssetById(Long id) {
        return assetRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Asset not found with id: " + id));
    }

    public List<Asset> getAssetsByStatus(AssetStatus status) {
        return assetRepository.findByAssetStatus(status);
    }

    public Asset updateAsset(Long id, Asset updatedAsset) {

        Asset existingAsset = assetRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Asset not found with id: " + id));

        existingAsset.setItemName(updatedAsset.getItemName());
        existingAsset.setCategory(updatedAsset.getCategory());
        existingAsset.setConditionStatus(updatedAsset.getConditionStatus());
        existingAsset.setAssetStatus(updatedAsset.getAssetStatus());

        return assetRepository.save(existingAsset);
    }

    public void deleteAsset(Long id) {
        if (!assetRepository.existsById(id)) {
            throw new RuntimeException("Asset not found with id: " + id);
        }

        assetRepository.deleteById(id);
    }
}