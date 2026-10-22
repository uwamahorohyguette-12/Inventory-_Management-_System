package com.amigocode.inventory_management_system.controller;

import com.amigocode.inventory_management_system.dto.EmployeeLoginDTO;
import com.amigocode.inventory_management_system.dto.EmployeeLoginResponseDTO;
import com.amigocode.inventory_management_system.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class EmployeeAuthController {

    private final EmployeeService employeeService;

    public EmployeeAuthController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @PostMapping("/employee-login")
    public ResponseEntity<EmployeeLoginResponseDTO> loginEmployee(
            @Valid @RequestBody EmployeeLoginDTO loginDTO) {
        return ResponseEntity.ok(employeeService.authenticate(loginDTO));
    }
}