package com.amigocode.inventory_management_system.dto;

import com.amigocode.inventory_management_system.entity.RequestStatus;

public class RequestStatusUpdateDTO {

    private RequestStatus status;

    public RequestStatusUpdateDTO() {
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }
}
