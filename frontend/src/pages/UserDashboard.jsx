import { useEffect, useMemo, useState } from "react";
import { createRequest, decideAssetAssignment, getAssets, getRequests } from "../services/api";
import { useFeedback } from "../components/useFeedback";
import "./UserDashboard.css";

const formatStatus = (status = "PENDING") => status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function UserDashboard({ user }) {
    const showToast = useFeedback();
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [requestError, setRequestError] = useState("");
    const [selectedAssetIds, setSelectedAssetIds] = useState([]);
    const [readyAfterHours, setReadyAfterHours] = useState(24);
    const [submitting, setSubmitting] = useState(false);
    const [decisionAssetId, setDecisionAssetId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function loadMyRequests() {
            try {
                const [requestData, assetData] = await Promise.all([getRequests(), getAssets()]);
                if (!cancelled) {
                    const allRequests = Array.isArray(requestData) ? requestData : [];
                    setRequests(allRequests.filter((request) =>
                        Number(request.employee?.id ?? request.employeeId) === Number(user.id)
                    ));
                    setAssets(Array.isArray(assetData) ? assetData : []);
                    if (refreshKey > 0) {
                        showToast("Your dashboard is up to date.");
                    }
                }
            } catch (loadError) {
                console.error("Could not load employee requests:", loadError);
                if (!cancelled) {
                    setError("Could not load your requests. Check that the backend is running.");
                    if (refreshKey > 0) {
                        showToast("Could not refresh your dashboard.", "error");
                    }
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadMyRequests();
        return () => {
            cancelled = true;
        };
    }, [user.id, refreshKey, showToast]);

    const availableAssets = useMemo(
        () => assets.filter((asset) => asset.assetStatus === "IN_STOCK"),
        [assets]
    );
    const myAssignments = useMemo(
        () => assets.filter((asset) =>
            Number(asset.assignedTo?.id) === Number(user.id)
            && asset.assetStatus === "ASSIGNED"
        ),
        [assets, user.id]
    );

    const counts = useMemo(() => ({
        total: requests.length,
        pending: requests.filter((request) => request.status === "PENDING").length,
        ready: requests.filter((request) => request.status === "READY").length,
        completed: requests.filter((request) => request.status === "COMPLETED").length,
    }), [requests]);

    const toggleAsset = (assetId) => {
        setSelectedAssetIds((current) => current.includes(assetId)
            ? current.filter((id) => id !== assetId)
            : [...current, assetId]
        );
    };

    const handleRefresh = () => {
        setLoading(true);
        setRefreshKey((current) => current + 1);
    };

    const handleRequestSubmit = async (event) => {
        event.preventDefault();
        setRequestError("");

        if (!selectedAssetIds.length) {
            setRequestError("Select at least one available item.");
            return;
        }

        try {
            setSubmitting(true);
            const createdRequest = await createRequest({
                employeeId: Number(user.id),
                assetIds: selectedAssetIds.map(Number),
                readyAfterHours: Number(readyAfterHours) || 24,
            });
            setRequests((current) => [createdRequest, ...current]);
            setSelectedAssetIds([]);
            setReadyAfterHours(24);
            showToast("Your asset request was submitted.");
        } catch (submitError) {
            console.error("Could not submit asset request:", submitError);
            setRequestError("Could not submit your request. Please try again.");
            showToast("Could not submit your asset request.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignmentDecision = async (asset, accepted) => {
        if (!accepted && !window.confirm(`Decline ${asset.itemName} and return it to available inventory?`)) {
            return;
        }

        try {
            setDecisionAssetId(asset.id);
            const updatedAsset = await decideAssetAssignment(asset.id, user.id, accepted);
            setAssets((current) => current.map((item) => item.id === updatedAsset.id ? updatedAsset : item));
            showToast(accepted
                ? `You accepted ${asset.itemName}.`
                : `You declined ${asset.itemName}; it is available again.`);
        } catch (decisionError) {
            console.error("Could not update assignment decision:", decisionError);
            showToast(decisionError.response?.status === 403
                ? "You cannot respond to another employee's assignment."
                : "Could not update this assignment.", "error");
        } finally {
            setDecisionAssetId(null);
        }
    };

    return (
        <main className="employee-dashboard">
            <header className="employee-dashboard-header">
                <div>
                    <span className="employee-dashboard-eyebrow">PERSONAL WORKSPACE</span>
                    <h1>Welcome, {user.name}</h1>
                    <p>{user.department || "Employee"} · Your requests and their current status.</p>
                </div>
                <div className="employee-dashboard-header-actions">
                    <button type="button" className="employee-refresh-button" onClick={handleRefresh} disabled={loading}>
                        <span aria-hidden="true">↻</span> {loading ? "Refreshing..." : "Refresh"}
                    </button>
                    <div className="employee-profile-mark" aria-hidden="true">
                        {user.name?.trim().charAt(0).toUpperCase() || "U"}
                    </div>
                </div>
            </header>

            {error && <div className="employee-dashboard-error" role="alert">{error}</div>}

            <section className="employee-task-stats" aria-label="My request summary">
                <article className="employee-task-stat">
                    <span>My requests</span>
                    <strong>{loading ? "—" : counts.total}</strong>
                    <small>All requests submitted</small>
                </article>
                <article className="employee-task-stat employee-task-pending">
                    <span>Pending</span>
                    <strong>{loading ? "—" : counts.pending}</strong>
                    <small>Waiting for review</small>
                </article>
                <article className="employee-task-stat employee-task-ready">
                    <span>Ready</span>
                    <strong>{loading ? "—" : counts.ready}</strong>
                    <small>Available for collection</small>
                </article>
                <article className="employee-task-stat employee-task-complete">
                    <span>Completed</span>
                    <strong>{loading ? "—" : counts.completed}</strong>
                    <small>Closed requests</small>
                </article>
            </section>

            <section className="my-assignments-section" aria-labelledby="my-assignments-heading">
                <div className="my-assignments-heading">
                    <div>
                        <h2 id="my-assignments-heading">My equipment assignments</h2>
                        <p>Review equipment assigned to you and confirm whether you accept it.</p>
                    </div>
                    <span className="my-assignments-total">{myAssignments.length} {myAssignments.length === 1 ? "item" : "items"}</span>
                </div>

                {myAssignments.length ? (
                    <div className="my-assignment-list">
                        {myAssignments.map((asset) => {
                            const isPending = asset.assignmentDecisionStatus === "PENDING";
                            const isDeciding = decisionAssetId === asset.id;

                            return (
                                <article className="my-assignment-card" key={asset.id}>
                                    <div className="my-assignment-asset-icon" aria-hidden="true">▦</div>
                                    <div className="my-assignment-details">
                                        <strong>{asset.itemName}</strong>
                                        <span>{asset.category} · {asset.conditionStatus || "Condition unknown"}</span>
                                        <span className={`my-assignment-state ${isPending ? "assignment-pending" : "assignment-accepted"}`}>
                                            {isPending ? "Awaiting your response" : "Accepted"}
                                        </span>
                                    </div>
                                    {isPending ? (
                                        <div className="my-assignment-actions">
                                            <button type="button" className="assignment-decline-button" onClick={() => handleAssignmentDecision(asset, false)} disabled={isDeciding}>
                                                Decline
                                            </button>
                                            <button type="button" className="assignment-accept-button" onClick={() => handleAssignmentDecision(asset, true)} disabled={isDeciding}>
                                                {isDeciding ? "Saving..." : "Accept"}
                                            </button>
                                        </div>
                                    ) : <span className="assignment-accepted-mark" aria-label="Accepted">✓</span>}
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="my-assignments-empty">No equipment is currently assigned to you.</div>
                )}
            </section>

            <section className="employee-request-panel" aria-labelledby="request-assets-heading">
                <div className="employee-request-heading">
                    <div>
                        <h2 id="request-assets-heading">Request equipment</h2>
                        <p>Choose available inventory items for your work.</p>
                    </div>
                    <span className="available-count">{availableAssets.length} available</span>
                </div>

                {requestError && <div className="employee-dashboard-error" role="alert">{requestError}</div>}

                <form className="employee-request-form" onSubmit={handleRequestSubmit}>
                    <fieldset className="employee-asset-options" disabled={submitting || loading}>
                        <legend className="visually-hidden">Available assets to request</legend>
                        {availableAssets.length ? availableAssets.map((asset) => (
                            <label className="employee-asset-option" key={asset.id}>
                                <input
                                    type="checkbox"
                                    checked={selectedAssetIds.includes(asset.id)}
                                    onChange={() => toggleAsset(asset.id)}
                                />
                                <span className="employee-asset-option-copy">
                                    <strong>{asset.itemName}</strong>
                                    <small>{asset.category}</small>
                                </span>
                                <span className="employee-asset-available">In stock</span>
                            </label>
                        )) : (
                            <p className="employee-no-assets">
                                {loading ? "Loading available assets..." : "No in-stock assets are currently available."}
                            </p>
                        )}
                    </fieldset>

                    <div className="employee-request-actions">
                        <label className="employee-ready-time">
                            <span>Ready after</span>
                            <input
                                type="number"
                                min="1"
                                max="720"
                                value={readyAfterHours}
                                onChange={(event) => setReadyAfterHours(event.target.value)}
                                disabled={submitting}
                            />
                            <span>hours</span>
                        </label>
                        <button type="submit" className="employee-request-submit" disabled={submitting || loading || !availableAssets.length}>
                            {submitting ? "Submitting..." : "Submit request"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="my-requests-section" aria-labelledby="my-requests-heading">
                <div className="my-requests-heading">
                    <div>
                        <h2 id="my-requests-heading">My requests</h2>
                        <p>Only requests associated with your employee profile are shown.</p>
                    </div>
                    <span className="my-requests-total">{loading ? "Loading" : `${requests.length} total`}</span>
                </div>

                {loading ? (
                    <div className="my-requests-empty">Loading your requests...</div>
                ) : requests.length ? (
                    <div className="my-request-list">
                        {requests
                            .slice()
                            .sort((first, second) => new Date(second.requestDate || 0) - new Date(first.requestDate || 0))
                            .map((request) => {
                                const statusClass = String(request.status || "PENDING").toLowerCase().replaceAll("_", "-");
                                const itemNames = request.items?.map((item) => item.asset?.itemName || "Asset").filter(Boolean) || [];

                                return (
                                    <article className="my-request-card" key={request.id}>
                                        <div className="my-request-topline">
                                            <div>
                                                <span className="my-request-id">REQUEST #{request.id}</span>
                                                <h3>{itemNames.length ? itemNames.join(", ") : "Inventory request"}</h3>
                                            </div>
                                            <span className={`my-request-status status-${statusClass}`}>
                                                {formatStatus(request.status)}
                                            </span>
                                        </div>
                                        <div className="my-request-meta">
                                            <span>Submitted {request.requestDate ? new Date(request.requestDate).toLocaleDateString() : "date unavailable"}</span>
                                            {request.readyAt && <span>Expected {new Date(request.readyAt).toLocaleString()}</span>}
                                            <span>{request.items?.length || 0} {request.items?.length === 1 ? "item" : "items"}</span>
                                        </div>
                                        {request.status === "NOT_AVAILABLE" && (
                                            <p className="my-request-note">One or more requested items are currently unavailable.</p>
                                        )}
                                    </article>
                                );
                            })}
                    </div>
                ) : (
                    <div className="my-requests-empty">
                        <strong>No requests yet</strong>
                        <span>Your requests will appear here when they are submitted by your administrator.</span>
                    </div>
                )}
            </section>

            <p className="employee-dashboard-note">You can submit requests for yourself and track their status here. Administrators manage approvals and inventory.</p>
        </main>
    );
}

export default UserDashboard;
