import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:8080/api",
});

export const getAssets = async () => {
    const response = await API.get("/assets");
    return response.data;
};

export const createAsset = async (asset) => {
    const response = await API.post("/assets", asset);
    return response.data;
};

export const updateAsset = async (id, asset) => {
    const response = await API.put(`/assets/${id}`, asset);
    return response.data;
};

export const updateAssetAssignment = async (id, employeeId) => {
    const response = await API.put(`/assets/${id}/assignment`, { employeeId });
    return response.data;
};

export const decideAssetAssignment = async (id, employeeId, accepted) => {
    const response = await API.patch(`/assets/${id}/assignment-decision`, { employeeId, accepted });
    return response.data;
};

export const deleteAsset = async (id) => {
    const response = await API.delete(`/assets/${id}`);
    return response.data;
};

export const getEmployees = async () => {
    const response = await API.get("/employees");
    return response.data;
};

export const employeeLogin = async (credentials) => {
    const response = await API.post("/auth/employee-login", credentials);
    return response.data;
};

export const createEmployee = async (employee) => {
    const response = await API.post("/employees", employee);
    return response.data;
};

export const updateEmployee = async (id, employee) => {
    const response = await API.put(`/employees/${id}`, employee);
    return response.data;
};

export const deleteEmployee = async (id) => {
    const response = await API.delete(`/employees/${id}`);
    return response.data;
};

export const getRequests = async () => {
    const response = await API.get("/requests");
    return response.data;
};

export const createRequest = async (request) => {
    const response = await API.post("/requests", request);
    return response.data;
};

export const updateRequestStatus = async (id, status) => {
    const response = await API.patch(`/requests/${id}/status`, { status });
    return response.data;
};