package com.amigocode.inventory_management_system.controller;

import com.amigocode.inventory_management_system.dto.RequestCreateDTO;
import com.amigocode.inventory_management_system.dto.RequestStatusUpdateDTO;
import com.amigocode.inventory_management_system.entity.Request;
import com.amigocode.inventory_management_system.service.RequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:5173")
public class RequestController {

    private final RequestService requestService;

    public RequestController(RequestService requestService) {
        this.requestService = requestService;
    }

    @PostMapping
    public ResponseEntity<Request> createRequest(
            @RequestBody RequestCreateDTO requestDTO) {

        return ResponseEntity.ok(
                requestService.createRequest(requestDTO)
        );
    }

    @GetMapping
    public ResponseEntity<List<Request>> getAllRequests() {

        return ResponseEntity.ok(
                requestService.getAllRequests()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Request> getRequestById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                requestService.getRequestById(id)
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Request> updateRequestStatus(
            @PathVariable Long id,
            @RequestBody RequestStatusUpdateDTO requestStatusDTO) {

        return ResponseEntity.ok(
                requestService.updateRequestStatus(id, requestStatusDTO)
        );
    }
}