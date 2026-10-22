package com.amigocode.inventory_management_system;

import com.amigocode.inventory_management_system.controller.AssetController;
import com.amigocode.inventory_management_system.dto.AssignmentDecisionDTO;
import com.amigocode.inventory_management_system.dto.AssetAssignmentDTO;
import com.amigocode.inventory_management_system.entity.Asset;
import com.amigocode.inventory_management_system.entity.AssetCondition;
import com.amigocode.inventory_management_system.entity.AssetStatus;
import com.amigocode.inventory_management_system.entity.AssignmentDecisionStatus;
import com.amigocode.inventory_management_system.entity.Employee;
import com.amigocode.inventory_management_system.repository.AssetRepository;
import com.amigocode.inventory_management_system.repository.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
class AssetAssignmentTest {

    @Autowired
    private AssetController assetController;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Test
    void assignAndRelease_shouldUpdateEmployeeAndAssetStatus() {
        Employee employee = employeeRepository.save(
                new Employee("Assignment User", "assignment-user@example.com", "IT")
        );
        Asset asset = assetRepository.save(
                new Asset("Assignment Laptop", "Laptop", AssetCondition.GOOD, AssetStatus.IN_STOCK)
        );

        AssetAssignmentDTO assignment = new AssetAssignmentDTO();
        assignment.setEmployeeId(employee.getId());

        Asset assignedAsset = assetController.updateAssignment(asset.getId(), assignment);

        assertEquals(AssetStatus.ASSIGNED, assignedAsset.getAssetStatus());
        assertEquals(employee.getId(), assignedAsset.getAssignedTo().getId());
        assertEquals(AssignmentDecisionStatus.PENDING, assignedAsset.getAssignmentDecisionStatus());

        Employee otherEmployee = employeeRepository.save(
            new Employee("Other User", "other-assignment@example.com", "Finance")
        );
        AssignmentDecisionDTO otherEmployeeDecision = new AssignmentDecisionDTO();
        otherEmployeeDecision.setEmployeeId(otherEmployee.getId());
        otherEmployeeDecision.setAccepted(true);
        ResponseStatusException forbidden = assertThrows(ResponseStatusException.class,
            () -> assetController.decideAssignment(asset.getId(), otherEmployeeDecision));
        assertEquals(HttpStatus.FORBIDDEN, forbidden.getStatusCode());

        AssignmentDecisionDTO acceptance = new AssignmentDecisionDTO();
        acceptance.setEmployeeId(employee.getId());
        acceptance.setAccepted(true);

        Asset acceptedAsset = assetController.decideAssignment(asset.getId(), acceptance);
        assertEquals(AssignmentDecisionStatus.ACCEPTED, acceptedAsset.getAssignmentDecisionStatus());

        Asset declinedItem = assetRepository.save(
            new Asset("Declined Laptop", "Laptop", AssetCondition.GOOD, AssetStatus.IN_STOCK)
        );
        assetController.updateAssignment(declinedItem.getId(), assignment);

        AssignmentDecisionDTO decline = new AssignmentDecisionDTO();
        decline.setEmployeeId(employee.getId());
        decline.setAccepted(false);
        Asset declinedAsset = assetController.decideAssignment(declinedItem.getId(), decline);

        assertEquals(AssignmentDecisionStatus.DECLINED, declinedAsset.getAssignmentDecisionStatus());
        assertEquals(AssetStatus.IN_STOCK, declinedAsset.getAssetStatus());
        assertNull(declinedAsset.getAssignedTo());

        AssetAssignmentDTO release = new AssetAssignmentDTO();
        Asset releasedAsset = assetController.updateAssignment(asset.getId(), release);

        assertEquals(AssetStatus.IN_STOCK, releasedAsset.getAssetStatus());
        assertNull(releasedAsset.getAssignedTo());
    }
}
