import { useEffect, useState } from "react";
import { createRequest, getAssets, getEmployees, getRequests, updateRequestStatus } from "../services/api";
import { useFeedback } from "../components/useFeedback";

const initialForm = {
    employeeId: "",
    assetIds: [],
    readyAfterHours: 24,
};

function Requests() {
    const showToast = useFeedback();
    const [employees, setEmployees] = useState([]);
    const [assets, setAssets] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingRequestId, setUpdatingRequestId] = useState(null);
    const [formData, setFormData] = useState(initialForm);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            try {
                const [employeeData, assetData, requestData] = await Promise.all([
                    getEmployees(),
                    getAssets(),
                    getRequests(),
                ]);
                if (!cancelled) {
                    setEmployees(Array.isArray(employeeData) ? employeeData : []);
                    setAssets(Array.isArray(assetData) ? assetData : []);
                    setRequests(Array.isArray(requestData) ? requestData : []);
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setError("Could not load requests data.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadData();
        return () => {
            cancelled = true;
        };
    }, []);

    const toggleAsset = (assetId) => {
        setFormData((previous) => {
            const selected = previous.assetIds.includes(assetId)
                ? previous.assetIds.filter((id) => id !== assetId)
                : [...previous.assetIds, assetId];

            return {
                ...previous,
                assetIds: selected,
            };
        });
    };

    const handleStatusChange = async (requestId, status) => {
        try {
            setUpdatingRequestId(requestId);
            setError("");
            const updatedRequest = await updateRequestStatus(requestId, status);
            setRequests((previous) => previous.map((request) =>
                request.id === requestId ? updatedRequest : request
            ));
            showToast(`Request #${requestId} updated to ${status.replaceAll("_", " ")}.`);
        } catch (err) {
            console.error(err);
            setError(`Could not update request #${requestId}.`);
            showToast("Could not update request status.", "error");
        } finally {
            setUpdatingRequestId(null);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.employeeId) {
            setError("Please select an employee.");
            return;
        }

        if (!formData.assetIds.length) {
            setError("Select at least one asset to request.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const payload = {
                employeeId: Number(formData.employeeId),
                assetIds: formData.assetIds.map(Number),
                readyAfterHours: Number(formData.readyAfterHours || 24),
            };

            const created = await createRequest(payload);
            setRequests((previous) => [created, ...(Array.isArray(previous) ? previous : [])]);
            setFormData(initialForm);
            showToast("Request submitted successfully.");
        } catch (err) {
            console.error(err);
            setError("Could not create request.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h1>Requests</h1>
                    <p>Track employee inventory requests.</p>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="request-grid">
                <div className="panel-box">
                    <h3>Create Request</h3>

                    <form className="asset-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="employeeId">Employee</label>
                            <select
                                id="employeeId"
                                value={formData.employeeId}
                                onChange={(event) =>
                                    setFormData({ ...formData, employeeId: event.target.value })
                                }
                            >
                                <option value="">Select employee</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Requested Items</label>
                            <div className="asset-checkbox-list">
                                {assets.map((asset) => (
                                    <label key={asset.id} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={formData.assetIds.includes(asset.id)}
                                            onChange={() => toggleAsset(asset.id)}
                                        />
                                        <span>
                                            {asset.itemName} ({asset.category})
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="readyAfterHours">Ready After (Hours)</label>
                            <input
                                id="readyAfterHours"
                                type="number"
                                min="1"
                                value={formData.readyAfterHours}
                                onChange={(event) =>
                                    setFormData({
                                        ...formData,
                                        readyAfterHours: event.target.value,
                                    })
                                }
                            />
                        </div>

                        <button type="submit" className="save-btn" disabled={saving}>
                            {saving ? "Submitting..." : "Submit Request"}
                        </button>
                    </form>
                </div>

                <div className="panel-box">
                    <h3>Recent Requests</h3>

                    {loading ? (
                        <div className="empty-assets">Loading requests...</div>
                    ) : requests.length === 0 ? (
                        <div className="empty-assets">No requests yet.</div>
                    ) : (
                        <div className="request-list">
                            {requests.map((request) => (
                                <div key={request.id} className="request-item-card">
                                    <div className="request-topline">
                                        <strong>#{request.id}</strong>
                                        <label className="request-status-control">
                                            <span className="visually-hidden">Update request #{request.id} status</span>
                                            <select
                                                className="request-status-select"
                                                value={request.status}
                                                onChange={(event) => handleStatusChange(request.id, event.target.value)}
                                                disabled={updatingRequestId === request.id}
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="READY">Ready</option>
                                                <option value="NOT_AVAILABLE">Not Available</option>
                                                <option value="COMPLETED">Completed</option>
                                            </select>
                                        </label>
                                    </div>
                                    <p>
                                        Employee: {request.employee?.fullName ?? "Unknown"}
                                    </p>
                                    <p>
                                        Items: {request.items?.map((item) => item.asset?.itemName ?? "Item").join(", ") || "None"}
                                    </p>
                                    <p>
                                        Requested: {request.requestDate ? new Date(request.requestDate).toLocaleString() : "N/A"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Requests;
