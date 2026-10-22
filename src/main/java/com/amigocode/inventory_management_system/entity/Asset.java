package com.amigocode.inventory_management_system.entity;

import com.amigocode.inventory_management_system.entity.AssetCondition;
import com.amigocode.inventory_management_system.entity.AssetStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "assets")
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String itemName;

    private String category;

    @Enumerated(EnumType.STRING)
    private AssetCondition conditionStatus;

    @Enumerated(EnumType.STRING)
    private AssetStatus assetStatus;

    @ManyToOne
    @JoinColumn(name = "assigned_to_id")
    private Employee assignedTo;

    @Enumerated(EnumType.STRING)
    private AssignmentDecisionStatus assignmentDecisionStatus;

    // Empty constructor required by JPA
    public Asset() {
    }

    // Constructor
    public Asset(String itemName, String category,
                 AssetCondition conditionStatus,
                 AssetStatus assetStatus) {
        this.itemName = itemName;
        this.category = category;
        this.conditionStatus = conditionStatus;
        this.assetStatus = assetStatus;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public AssetCondition getConditionStatus() {
        return conditionStatus;
    }

    public void setConditionStatus(AssetCondition conditionStatus) {
        this.conditionStatus = conditionStatus;
    }

    public AssetStatus getAssetStatus() {
        return assetStatus;
    }

    public void setAssetStatus(AssetStatus assetStatus) {
        this.assetStatus = assetStatus;
    }

    public Employee getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Employee assignedTo) {
        this.assignedTo = assignedTo;
    }

    public AssignmentDecisionStatus getAssignmentDecisionStatus() {
        return assignmentDecisionStatus;
    }

    public void setAssignmentDecisionStatus(AssignmentDecisionStatus assignmentDecisionStatus) {
        this.assignmentDecisionStatus = assignmentDecisionStatus;
    }
}