package com.amigocode.inventory_management_system;

import com.amigocode.inventory_management_system.controller.RequestController;
import com.amigocode.inventory_management_system.dto.RequestStatusUpdateDTO;
import com.amigocode.inventory_management_system.entity.Employee;
import com.amigocode.inventory_management_system.entity.Request;
import com.amigocode.inventory_management_system.entity.RequestStatus;
import com.amigocode.inventory_management_system.repository.EmployeeRepository;
import com.amigocode.inventory_management_system.repository.RequestRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

@SpringBootTest
@ActiveProfiles("test")
class RequestStatusUpdateTest {

    @Autowired
    private RequestController requestController;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private RequestRepository requestRepository;

    @Test
    void updateRequestStatus_shouldPersistStatusAndKeepReadyTimeConsistent() {
        Employee employee = employeeRepository.save(
                new Employee("Request Status User", "request-status@example.com", "IT")
        );
        Request request = new Request();
        request.setEmployee(employee);
        request.setRequestDate(LocalDateTime.now());
        request.setStatus(RequestStatus.PENDING);
        request = requestRepository.save(request);

        RequestStatusUpdateDTO readyUpdate = new RequestStatusUpdateDTO();
        readyUpdate.setStatus(RequestStatus.READY);

        ResponseEntity<Request> readyResponse = requestController.updateRequestStatus(
                request.getId(), readyUpdate
        );

        assertEquals(RequestStatus.READY, readyResponse.getBody().getStatus());
        assertNotNull(readyResponse.getBody().getReadyAt());

        RequestStatusUpdateDTO unavailableUpdate = new RequestStatusUpdateDTO();
        unavailableUpdate.setStatus(RequestStatus.NOT_AVAILABLE);

        ResponseEntity<Request> unavailableResponse = requestController.updateRequestStatus(
                request.getId(), unavailableUpdate
        );

        assertEquals(RequestStatus.NOT_AVAILABLE, unavailableResponse.getBody().getStatus());
        assertNull(unavailableResponse.getBody().getReadyAt());
    }
}