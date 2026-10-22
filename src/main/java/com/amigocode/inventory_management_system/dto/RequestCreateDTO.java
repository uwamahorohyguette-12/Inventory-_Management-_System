package com.amigocode.inventory_management_system.dto;

import java.util.List;

public class RequestCreateDTO {

    private Long employeeId;

    private List<Long> assetIds;

    private Integer readyAfterHours;

    public RequestCreateDTO() {
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public List<Long> getAssetIds() {
        return assetIds;
    }

    public void setAssetIds(List<Long> assetIds) {
        this.assetIds = assetIds;
    }

    public Integer getReadyAfterHours() {
        return readyAfterHours;
    }

    public void setReadyAfterHours(Integer readyAfterHours) {
        this.readyAfterHours = readyAfterHours;
    }
}