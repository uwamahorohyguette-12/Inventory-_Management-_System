package com.amigocode.inventory_management_system.dto;

public class AssignmentDecisionDTO {

    private Long employeeId;
    private Boolean accepted;

    public AssignmentDecisionDTO() {
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public Boolean getAccepted() {
        return accepted;
    }

    public void setAccepted(Boolean accepted) {
        this.accepted = accepted;
    }
}
