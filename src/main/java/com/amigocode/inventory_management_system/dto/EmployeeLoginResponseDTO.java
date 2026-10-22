package com.amigocode.inventory_management_system.dto;

public class EmployeeLoginResponseDTO {

    private final Long id;
    private final String name;
    private final String email;
    private final String department;
    private final String role = "employee";

    public EmployeeLoginResponseDTO(Long id, String name, String email, String department) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.department = department;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getDepartment() {
        return department;
    }

    public String getRole() {
        return role;
    }
}