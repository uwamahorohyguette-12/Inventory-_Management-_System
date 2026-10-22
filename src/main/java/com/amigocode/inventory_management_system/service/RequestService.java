package com.amigocode.inventory_management_system.service;

import com.amigocode.inventory_management_system.dto.RequestCreateDTO;
import com.amigocode.inventory_management_system.dto.RequestStatusUpdateDTO;
import com.amigocode.inventory_management_system.entity.Asset;
import com.amigocode.inventory_management_system.entity.Employee;
import com.amigocode.inventory_management_system.entity.Request;
import com.amigocode.inventory_management_system.entity.RequestItem;
import com.amigocode.inventory_management_system.entity.AssetStatus;
import com.amigocode.inventory_management_system.entity.RequestStatus;
import com.amigocode.inventory_management_system.repository.AssetRepository;
import com.amigocode.inventory_management_system.repository.EmployeeRepository;
import com.amigocode.inventory_management_system.repository.RequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RequestService {

    private final RequestRepository requestRepository;
    private final EmployeeRepository employeeRepository;
    private final AssetRepository assetRepository;

    public RequestService(
            RequestRepository requestRepository,
            EmployeeRepository employeeRepository,
            AssetRepository assetRepository) {

        this.requestRepository = requestRepository;
        this.employeeRepository = employeeRepository;
        this.assetRepository = assetRepository;
    }

    @Transactional
    public Request createRequest(RequestCreateDTO dto) {

        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Employee not found with id: " + dto.getEmployeeId()
                        )
                );

        if (dto.getAssetIds() == null || dto.getAssetIds().isEmpty()) {
            throw new RuntimeException(
                    "At least one asset must be requested"
            );
        }

        Request request = new Request();

        request.setEmployee(employee);
        request.setRequestDate(LocalDateTime.now());
        request.setStatus(RequestStatus.PENDING);

        boolean allAvailable = true;

        for (Long assetId : dto.getAssetIds()) {

            Asset asset = assetRepository.findById(assetId)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Asset not found with id: " + assetId
                            )
                    );

            RequestItem item = new RequestItem();

            item.setRequest(request);
            item.setAsset(asset);
            item.setQuantity(1);

            request.getItems().add(item);

            if (asset.getAssetStatus() != AssetStatus.IN_STOCK) {
                allAvailable = false;
            }
        }

        if (allAvailable) {

            request.setStatus(RequestStatus.READY);

            int hours = 24;

            if (dto.getReadyAfterHours() != null
                    && dto.getReadyAfterHours() > 0) {

                hours = dto.getReadyAfterHours();
            }

            request.setReadyAt(
                    LocalDateTime.now().plusHours(hours)
            );

        } else {

            request.setStatus(RequestStatus.NOT_AVAILABLE);
            request.setReadyAt(null);
        }

        return requestRepository.save(request);
    }

    public List<Request> getAllRequests() {
        return requestRepository.findAll();
    }

    public Request getRequestById(Long id) {

        return requestRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Request not found with id: " + id
                        )
                );
    }

        @Transactional
        public Request updateRequestStatus(Long id, RequestStatusUpdateDTO dto) {
                if (dto.getStatus() == null) {
                        throw new IllegalArgumentException("Request status is required");
                }

                Request request = getRequestById(id);
                request.setStatus(dto.getStatus());

                if (dto.getStatus() == RequestStatus.READY && request.getReadyAt() == null) {
                        request.setReadyAt(LocalDateTime.now());
                } else if (dto.getStatus() == RequestStatus.NOT_AVAILABLE) {
                        request.setReadyAt(null);
                }

                return requestRepository.save(request);
        }
}