package com.amigocode.inventory_management_system;

import com.amigocode.inventory_management_system.dto.EmployeeLoginDTO;
import com.amigocode.inventory_management_system.dto.EmployeeLoginResponseDTO;
import com.amigocode.inventory_management_system.dto.EmployeeUpsertDTO;
import com.amigocode.inventory_management_system.entity.Employee;
import com.amigocode.inventory_management_system.service.EmployeeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class EmployeeAuthTest {

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void employeePassword_shouldBeHashedAndUsedForLogin() {
        EmployeeUpsertDTO create = new EmployeeUpsertDTO();
        create.setFullName("Login Employee");
        create.setEmail("login-employee@example.com");
        create.setDepartment("Engineering");
        create.setPassword("1234");

        Employee employee = employeeService.createEmployee(create);
        assertNotEquals("1234", employee.getPasswordHash());
        assertTrue(passwordEncoder.matches("1234", employee.getPasswordHash()));

        EmployeeLoginDTO login = new EmployeeLoginDTO();
        login.setEmail("LOGIN-EMPLOYEE@example.com");
        login.setPassword("1234");
        EmployeeLoginResponseDTO profile = employeeService.authenticate(login);
        assertEquals(employee.getId(), profile.getId());
        assertEquals("employee", profile.getRole());

        login.setPassword("4321");
        ResponseStatusException rejected = assertThrows(ResponseStatusException.class,
                () -> employeeService.authenticate(login));
        assertEquals(HttpStatus.UNAUTHORIZED, rejected.getStatusCode());

        String previousHash = employee.getPasswordHash();
        EmployeeUpsertDTO update = new EmployeeUpsertDTO();
        update.setFullName("Login Employee Updated");
        update.setEmail("login-employee@example.com");
        update.setDepartment("Engineering");
        update.setPassword("");

        Employee updated = employeeService.updateEmployee(employee.getId(), update);
        assertEquals(previousHash, updated.getPasswordHash());
    }
}
