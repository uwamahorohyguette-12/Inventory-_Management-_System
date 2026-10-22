import { useEffect, useMemo, useState } from "react";
import { getAssets, getEmployees, updateAssetAssignment } from "../services/api";
import { useFeedback } from "../components/useFeedback";
import "./Assignments.css";

function assignmentLabel(asset) {
    if (asset.assetStatus === "ASSIGNED" && asset.assignmentDecisionStatus === "PENDING") {
        return "AWAITING RESPONSE";
    }
    if (asset.assetStatus === "ASSIGNED" && asset.assignmentDecisionStatus === "ACCEPTED") {
        return "ACCEPTED";
    }
    return String(asset.assetStatus || "UNKNOWN").replaceAll("_", " ");
}

function Assignments() {
    const showToast = useFeedback();
    const [assets, setAssets] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingAssetId, setUpdatingAssetId] = useState(null);
    const [error, setError] = useState("");
    const [assetId, setAssetId] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function loadAssignmentData() {
            try {
                setError("");
                const [assetData, employeeData] = await Promise.all([getAssets(), getEmployees()]);
                if (!cancelled) {
                    setAssets(Array.isArray(assetData) ? assetData : []);
                    setEmployees(Array.isArray(employeeData) ? employeeData : []);
                    if (refreshKey > 0) {
                        showToast("Assignments refreshed.");
                    }
                }
            } catch (loadError) {
                console.error("Could not load assignment data:", loadError);
                if (!cancelled) {
                    setError("Could not load assignments. Check that the backend is running.");
                    if (refreshKey > 0) {
                        showToast("Could not refresh assignments.", "error");
                    }
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadAssignmentData();
        return () => {
            cancelled = true;
        };
    }, [refreshKey, showToast]);

    const availableAssets = useMemo(
        () => assets.filter((asset) => asset.assetStatus === "IN_STOCK" && asset.conditionStatus !== "DAMAGED"),
        [assets]
    );
    const assignedAssets = useMemo(
        () => assets.filter((asset) => asset.assetStatus === "ASSIGNED"),
        [assets]
    );
    const visibleAssets = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        return assets.filter((asset) => {
            const assignedName = asset.assignedTo?.fullName || "unassigned person";
            const matchesFilter = filter === "all"
                || (filter === "assigned" && asset.assetStatus === "ASSIGNED")
                || (filter === "available" && asset.assetStatus === "IN_STOCK" && asset.conditionStatus !== "DAMAGED");
            const matchesSearch = !normalizedSearch
                || asset.itemName?.toLowerCase().includes(normalizedSearch)
                || asset.category?.toLowerCase().includes(normalizedSearch)
                || assignedName.toLowerCase().includes(normalizedSearch);
            return matchesFilter && matchesSearch;
        });
    }, [assets, filter, search]);

    const handleAssign = async (event) => {
        event.preventDefault();
        if (!assetId || !employeeId) {
            setError("Choose both an available asset and an employee.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            const updatedAsset = await updateAssetAssignment(Number(assetId), Number(employeeId));
            setAssets((current) => current.map((asset) => asset.id === updatedAsset.id ? updatedAsset : asset));
            const employee = employees.find((item) => item.id === Number(employeeId));
            setAssetId("");
            setEmployeeId("");
            showToast(`${updatedAsset.itemName} assigned to ${employee?.fullName || "employee"}.`);
        } catch (assignError) {
            console.error("Could not assign asset:", assignError);
            setError(assignError.response?.data?.detail || "Could not assign this asset.");
            showToast("Could not assign this asset.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleRelease = async (asset) => {
        const confirmed = window.confirm(`Release ${asset.itemName} back to available inventory?`);
        if (!confirmed) {
            return;
        }

        try {
            setUpdatingAssetId(asset.id);
            setError("");
            const updatedAsset = await updateAssetAssignment(asset.id, null);
            setAssets((current) => current.map((item) => item.id === updatedAsset.id ? updatedAsset : item));
            showToast(`${asset.itemName} returned to available inventory.`);
        } catch (releaseError) {
            console.error("Could not release asset:", releaseError);
            setError("Could not release this asset.");
            showToast("Could not release this asset.", "error");
        } finally {
            setUpdatingAssetId(null);
        }
    };

    const handleRefresh = () => {
        setLoading(true);
        setRefreshKey((current) => current + 1);
    };

    return (
        <main className="assignments-page">
            <header className="assignments-header">
                <div>
                    <span className="assignments-eyebrow">ASSET CUSTODY</span>
                    <h1>Assignments</h1>
                    <p>Assign inventory to employees and track who currently holds each item.</p>
                </div>
                <button className="assignment-refresh" type="button" onClick={handleRefresh} disabled={loading}>
                    <span aria-hidden="true">↻</span> {loading ? "Refreshing..." : "Refresh"}
                </button>
            </header>

            {error && <div className="assignment-error" role="alert">{error}</div>}

            <section className="assignment-metrics" aria-label="Assignment summary">
                <article><span>Total assets</span><strong>{loading ? "—" : assets.length}</strong><small>Across inventory</small></article>
                <article className="metric-assigned"><span>Assigned</span><strong>{loading ? "—" : assignedAssets.length}</strong><small>Currently with employees</small></article>
                <article className="metric-available"><span>Available</span><strong>{loading ? "—" : availableAssets.length}</strong><small>Ready to assign</small></article>
            </section>

            <section className="assignment-create-panel" aria-labelledby="new-assignment-heading">
                <div className="assignment-panel-heading">
                    <div><h2 id="new-assignment-heading">Create assignment</h2><p>Choose an in-stock asset and an employee.</p></div>
                    <span className="assignment-step-mark" aria-hidden="true">01</span>
                </div>
                <form className="assignment-form" onSubmit={handleAssign}>
                    <label>
                        <span>Asset</span>
                        <select value={assetId} onChange={(event) => setAssetId(event.target.value)} disabled={loading || saving} required>
                            <option value="">Select available asset</option>
                            {availableAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.itemName} · {asset.category}</option>)}
                        </select>
                    </label>
                    <label>
                        <span>Employee</span>
                        <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} disabled={loading || saving} required>
                            <option value="">Select employee</option>
                            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName} · {employee.department || "Unassigned"}</option>)}
                        </select>
                    </label>
                    <button type="submit" className="assignment-submit" disabled={loading || saving || !availableAssets.length || !employees.length}>
                        {saving ? "Assigning..." : "Assign asset"}
                    </button>
                </form>
                {!loading && !availableAssets.length && <p className="assignment-inline-note">No in-stock assets are available to assign.</p>}
                {!loading && !employees.length && <p className="assignment-inline-note">Add an employee before creating an assignment.</p>}
            </section>

            <section className="assignment-list-panel" aria-labelledby="assignment-list-heading">
                <div className="assignment-list-heading">
                    <div><h2 id="assignment-list-heading">Asset register</h2><p>Current custody and availability</p></div>
                    <div className="assignment-filters">
                        <label className="assignment-search">
                            <span aria-hidden="true">⌕</span>
                            <span className="visually-hidden">Search assignments</span>
                            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search asset or employee" />
                        </label>
                        <label className="assignment-filter-select">
                            <span className="visually-hidden">Filter assets</span>
                            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                                <option value="all">All assets</option>
                                <option value="assigned">Assigned</option>
                                <option value="available">Available</option>
                            </select>
                        </label>
                    </div>
                </div>

                {loading ? <div className="assignment-empty">Loading asset register...</div> : visibleAssets.length ? (
                    <div className="assignment-table-scroll">
                        <table className="assignment-table">
                            <thead><tr><th scope="col">Asset</th><th scope="col">Category</th><th scope="col">Assigned to</th><th scope="col">Condition</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead>
                            <tbody>
                                {visibleAssets.map((asset) => (
                                    <tr key={asset.id}>
                                        <td><div className="assignment-asset-cell"><span aria-hidden="true">▦</span><div><strong>{asset.itemName}</strong><small>Asset #{asset.id}</small></div></div></td>
                                        <td>{asset.category}</td>
                                        <td>{asset.assignedTo ? <div className="assignment-employee"><span>{asset.assignedTo.fullName?.trim().charAt(0).toUpperCase() || "E"}</span><div><strong>{asset.assignedTo.fullName}</strong><small>{asset.assignedTo.department || "Employee"}</small></div></div> : <span className={asset.assetStatus === "ASSIGNED" ? "assignment-missing-owner" : "assignment-unassigned"}>{asset.assetStatus === "ASSIGNED" ? "Assignee not recorded" : "Not assigned"}</span>}</td>
                                        <td><span className={`assignment-condition ${asset.conditionStatus === "DAMAGED" ? "condition-damaged" : ""}`}>{asset.conditionStatus || "Unknown"}</span></td>
                                        <td><span className={`assignment-status ${asset.assetStatus === "ASSIGNED" ? "assignment-status-assigned" : ""} ${asset.assignmentDecisionStatus === "PENDING" ? "assignment-status-pending" : ""}`}>{assignmentLabel(asset)}</span></td>
                                        <td>{asset.assetStatus === "ASSIGNED" ? <button className="release-assignment" type="button" onClick={() => handleRelease(asset)} disabled={updatingAssetId === asset.id}>{updatingAssetId === asset.id ? "Releasing..." : "Release"}</button> : asset.assetStatus === "IN_STOCK" && asset.conditionStatus !== "DAMAGED" ? <button className="quick-assign" type="button" onClick={() => { setAssetId(String(asset.id)); document.getElementById("new-assignment-heading")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>Assign</button> : <span className="assignment-no-action">Unavailable</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <div className="assignment-empty"><strong>No matching assets</strong><span>Change the search or filter to see other inventory.</span></div>}
            </section>
        </main>
    );
}

export default Assignments;
