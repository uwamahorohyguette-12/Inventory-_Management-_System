package com.amigocode.inventory_management_system;

import com.amigocode.inventory_management_system.controller.AssetController;
import com.amigocode.inventory_management_system.entity.*;
import com.amigocode.inventory_management_system.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AssetControllerDeleteTest {

    @Autowired
    private AssetController assetController;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private RequestItemRepository requestItemRepository;

    @Test
    void deleteAsset_shouldRemoveRelatedRequestItemsBeforeDeletingAsset() {
        Employee employee = employeeRepository.save(
                new Employee("Jane Doe", "jane@example.com", "IT")
        );

        Asset asset = assetRepository.save(
                new Asset("Dell Laptop", "Laptop", AssetCondition.GOOD, AssetStatus.IN_STOCK)
        );

        Request request = new Request();
        request.setEmployee(employee);
        request.setRequestDate(LocalDateTime.now());
        request.setReadyAt(LocalDateTime.now().plusDays(1));
        request.setStatus(RequestStatus.PENDING);
        request = requestRepository.save(request);

        RequestItem requestItem = new RequestItem();
        requestItem.setRequest(request);
        requestItem.setAsset(asset);
        requestItem.setQuantity(1);
        requestItemRepository.save(requestItem);

        assetController.deleteAsset(asset.getId());

        assertFalse(assetRepository.existsById(asset.getId()));
        assertTrue(requestItemRepository.findByAsset_Id(asset.getId()).isEmpty());
    }
}
