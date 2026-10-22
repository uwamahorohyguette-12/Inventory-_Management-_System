package com.amigocode.inventory_management_system.service;

import com.amigocode.inventory_management_system.dto.EmployeeLoginDTO;
import com.amigocode.inventory_management_system.dto.EmployeeLoginResponseDTO;
import com.amigocode.inventory_management_system.dto.EmployeeUpsertDTO;
import com.amigocode.inventory_management_system.entity.Employee;
import com.amigocode.inventory_management_system.repository.EmployeeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeService(EmployeeRepository employeeRepository, PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Employee createEmployee(EmployeeUpsertDTO employeeDTO) {
        if (employeeDTO.getPassword() == null || employeeDTO.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required for new employees");
        }

        Employee employee = new Employee(
                employeeDTO.getFullName(),
                employeeDTO.getEmail(),
                employeeDTO.getDepartment()
        );
        employee.setPasswordHash(passwordEncoder.encode(employeeDTO.getPassword()));
        return employeeRepository.save(employee);
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Employee not found with id: " + id
                        )
                );
    }

    public Employee updateEmployee(Long id, EmployeeUpsertDTO updatedEmployee) {

        Employee existingEmployee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Employee not found with id: " + id
                        )
                );

        existingEmployee.setFullName(updatedEmployee.getFullName());
        existingEmployee.setEmail(updatedEmployee.getEmail());
        existingEmployee.setDepartment(updatedEmployee.getDepartment());
        if (updatedEmployee.getPassword() != null && !updatedEmployee.getPassword().isBlank()) {
            existingEmployee.setPasswordHash(passwordEncoder.encode(updatedEmployee.getPassword()));
        }

        return employeeRepository.save(existingEmployee);
    }

    public EmployeeLoginResponseDTO authenticate(EmployeeLoginDTO loginDTO) {
        Employee employee = employeeRepository.findByEmailIgnoreCase(loginDTO.getEmail().trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (employee.getPasswordHash() == null
                || !passwordEncoder.matches(loginDTO.getPassword(), employee.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        return new EmployeeLoginResponseDTO(
                employee.getId(),
                employee.getFullName(),
                employee.getEmail(),
                employee.getDepartment()
        );
    }

    public void deleteEmployee(Long id) {

        if (!employeeRepository.existsById(id)) {
            throw new RuntimeException(
                    "Employee not found with id: " + id
            );
        }

        employeeRepository.deleteById(id);
    }
}