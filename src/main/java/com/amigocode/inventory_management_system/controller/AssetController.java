package com.amigocode.inventory_management_system.controller;

import com.amigocode.inventory_management_system.dto.AssetAssignmentDTO;
import com.amigocode.inventory_management_system.dto.AssignmentDecisionDTO;
import com.amigocode.inventory_management_system.entity.Asset;
import com.amigocode.inventory_management_system.entity.AssetCondition;
import com.amigocode.inventory_management_system.entity.AssetStatus;
import com.amigocode.inventory_management_system.entity.AssignmentDecisionStatus;
import com.amigocode.inventory_management_system.entity.Employee;
import com.amigocode.inventory_management_system.entity.RequestItem;
import com.amigocode.inventory_management_system.repository.AssetRepository;
import com.amigocode.inventory_management_system.repository.EmployeeRepository;
import com.amigocode.inventory_management_system.repository.RequestItemRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class AssetController {

    private final AssetRepository assetRepository;
    private final RequestItemRepository requestItemRepository;
    private final EmployeeRepository employeeRepository;

    public AssetController(
            AssetRepository assetRepository,
            RequestItemRepository requestItemRepository,
            EmployeeRepository employeeRepository) {
        this.assetRepository = assetRepository;
        this.requestItemRepository = requestItemRepository;
        this.employeeRepository = employeeRepository;
    }

    @PostMapping
    public Asset createAsset(@RequestBody Asset asset) {
        return assetRepository.save(asset);
    }

    @GetMapping
    public List<Asset> getAllAssets() {
        return assetRepository.findAll();
    }

    @PutMapping("/{id}")
    public Asset updateAsset(@PathVariable Long id, @RequestBody Asset asset) {
        Asset existingAsset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found with id: " + id));

        existingAsset.setItemName(asset.getItemName());
        existingAsset.setCategory(asset.getCategory());
        existingAsset.setConditionStatus(asset.getConditionStatus());
        existingAsset.setAssetStatus(asset.getAssetStatus());
        if (asset.getAssetStatus() != AssetStatus.ASSIGNED) {
            existingAsset.setAssignedTo(null);
            existingAsset.setAssignmentDecisionStatus(null);
        }

        return assetRepository.save(existingAsset);
    }

    @PutMapping("/{id}/assignment")
    @Transactional
    public Asset updateAssignment(
            @PathVariable Long id,
            @RequestBody AssetAssignmentDTO assignmentDTO) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Asset not found with id: " + id));

        if (assignmentDTO.getEmployeeId() == null) {
            asset.setAssignedTo(null);
            asset.setAssignmentDecisionStatus(null);
            if (asset.getAssetStatus() == AssetStatus.ASSIGNED) {
                asset.setAssetStatus(AssetStatus.IN_STOCK);
            }
            return assetRepository.save(asset);
        }

        if (asset.getAssetStatus() != AssetStatus.IN_STOCK) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Only in-stock assets can be assigned");
        }

        if (asset.getConditionStatus() == AssetCondition.DAMAGED) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Damaged assets cannot be assigned");
        }

        Employee employee = employeeRepository.findById(assignmentDTO.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Employee not found with id: " + assignmentDTO.getEmployeeId()));

        asset.setAssignedTo(employee);
        asset.setAssetStatus(AssetStatus.ASSIGNED);
        asset.setAssignmentDecisionStatus(AssignmentDecisionStatus.PENDING);
        return assetRepository.save(asset);
    }

    @PatchMapping("/{id}/assignment-decision")
    @Transactional
    public Asset decideAssignment(
            @PathVariable Long id,
            @RequestBody AssignmentDecisionDTO decisionDTO) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Asset not found with id: " + id));

        if (decisionDTO.getAccepted() == null || decisionDTO.getEmployeeId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Employee and decision are required");
        }

        if (asset.getAssignedTo() == null
                || !asset.getAssignedTo().getId().equals(decisionDTO.getEmployeeId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "This assignment belongs to another employee");
        }

        if (asset.getAssignmentDecisionStatus() != AssignmentDecisionStatus.PENDING
                || asset.getAssetStatus() != AssetStatus.ASSIGNED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This assignment is no longer pending");
        }

        if (decisionDTO.getAccepted()) {
            asset.setAssignmentDecisionStatus(AssignmentDecisionStatus.ACCEPTED);
        } else {
            asset.setAssignmentDecisionStatus(AssignmentDecisionStatus.DECLINED);
            asset.setAssetStatus(AssetStatus.IN_STOCK);
            asset.setAssignedTo(null);
        }

        return assetRepository.save(asset);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteAsset(@PathVariable Long id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found with id: " + id));

        List<RequestItem> requestItems = requestItemRepository.findByAsset_Id(id);
        if (!requestItems.isEmpty()) {
            requestItemRepository.deleteAll(requestItems);
        }

        assetRepository.delete(asset);
        return ResponseEntity.noContent().build();
    }
}