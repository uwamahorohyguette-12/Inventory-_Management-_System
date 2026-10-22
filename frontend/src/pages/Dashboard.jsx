import { useEffect, useState } from "react";
import { getAssets, createAsset } from "../services/api";
import { useFeedback } from "../components/useFeedback";
import "./Dashboard.css";

const initialForm = {
    itemName: "",
    category: "Laptop",
    conditionStatus: "GOOD",
    assetStatus: "IN_STOCK",
};

function Dashboard() {
    const showToast = useFeedback();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        ...initialForm,
    });

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function fetchAssets() {
            try {
                setLoading(true);

                const data = await getAssets();

                console.log("Dashboard assets:", data);

                if (!cancelled) {
                    setAssets(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Could not load assets:", error);

                if (!cancelled) {
                    setMessage("Could not load assets from the server.");
                    setMessageType("error");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchAssets();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const openAddForm = () => {
        setFormData({
            ...initialForm,
        });

        setMessage("");
        setMessageType("");
        setShowForm(true);
    };

    const closeAddForm = () => {
        if (saving) {
            return;
        }

        setShowForm(false);

        setFormData({
            ...initialForm,
        });

        setMessage("");
        setMessageType("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setMessageType("");

        if (!formData.itemName.trim()) {
            setMessage("Please enter the item name.");
            setMessageType("error");
            return;
        }

        try {
            setSaving(true);

            const asset = {
                itemName: formData.itemName.trim(),
                category: formData.category,
                conditionStatus: formData.conditionStatus,
                assetStatus: formData.assetStatus,
            };

            console.log("Saving asset:", asset);

            const newAsset = await createAsset(asset);

            console.log("New asset:", newAsset);

            setAssets((previous) => [
                ...previous,
                newAsset,
            ]);

            showToast("Asset added successfully.");

            setFormData({
                ...initialForm,
            });

            setTimeout(() => {
                setShowForm(false);
                setMessage("");
                setMessageType("");
            }, 1500);
        } catch (error) {
            console.error("Could not save asset:", error);

            setMessage(
                "Failed to add asset. Please check the backend."
            );

            setMessageType("error");
        } finally {
            setSaving(false);
        }
    };

    const totalAssets = assets.length;

    const availableAssets = assets.filter(
        (asset) => asset.assetStatus === "IN_STOCK"
    ).length;

    const assignedAssets = assets.filter(
        (asset) => asset.assetStatus === "ASSIGNED"
    ).length;

    const damagedAssets = assets.filter(
        (asset) => asset.conditionStatus === "DAMAGED"
    ).length;

    return (
        <div className="dashboard-page">

            {/* HEADER */}

            <div className="dashboard-header">

                <div>
                    <h1>Dashboard</h1>

                    <p>
                        Overview of your inventory and assets.
                    </p>
                </div>

                <button
                    type="button"
                    className="add-asset-btn"
                    onClick={openAddForm}
                >
                    + Add Asset
                </button>

            </div>

            {/* MESSAGE */}

            {message && (
                <div
                    className={
                        messageType === "success"
                            ? "dashboard-message success-message"
                            : "dashboard-message error-message"
                    }
                >
                    {message}
                </div>
            )}

            {/* CARDS */}

            <div className="dashboard-cards">

                <div className="dashboard-card">
                    <div className="card-icon">
                        📦
                    </div>

                    <div>
                        <p>Total Assets</p>

                        <h2>
                            {loading ? "..." : totalAssets}
                        </h2>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="card-icon">
                        ✅
                    </div>

                    <div>
                        <p>Available</p>

                        <h2>
                            {loading ? "..." : availableAssets}
                        </h2>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="card-icon">
                        👤
                    </div>

                    <div>
                        <p>Assigned</p>

                        <h2>
                            {loading ? "..." : assignedAssets}
                        </h2>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="card-icon">
                        ⚠️
                    </div>

                    <div>
                        <p>Damaged</p>

                        <h2>
                            {loading ? "..." : damagedAssets}
                        </h2>
                    </div>
                </div>

            </div>

            {/* RECENT ASSETS */}

            <div className="dashboard-section">

                <div className="section-header">
                    <div>
                        <h2>Recent Assets</h2>

                        <p>
                            Recently added inventory items
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-dashboard">
                        <div className="empty-icon">
                            ⏳
                        </div>

                        <h3>Loading assets...</h3>
                    </div>
                ) : assets.length === 0 ? (
                    <div className="empty-dashboard">

                        <div className="empty-icon">
                            📦
                        </div>

                        <h3>No assets yet</h3>

                        <p>
                            Add your first asset to start
                            managing your inventory.
                        </p>

                    </div>
                ) : (
                    <div className="recent-assets">

                        {assets
                            .slice(-5)
                            .reverse()
                            .map((asset) => (
                                <div
                                    className="recent-asset"
                                    key={asset.id}
                                >

                                    <div className="recent-asset-info">

                                        <div className="asset-small-icon">
                                            📦
                                        </div>

                                        <div>
                                            <strong>
                                                {asset.itemName}
                                            </strong>

                                            <span>
                                                {asset.category}
                                            </span>
                                        </div>

                                    </div>

                                    <div className="recent-asset-details">

                                        <span className="condition-badge">
                                            {asset.conditionStatus}
                                        </span>

                                        <span className="status-badge">
                                            {asset.assetStatus}
                                        </span>

                                    </div>

                                </div>
                            ))}

                    </div>
                )}

            </div>

            {/* ADD ASSET MODAL */}

            {showForm && (
                <div className="modal-overlay">

                    <div className="asset-modal">

                        <div className="modal-header">

                            <div>
                                <h2>Add Asset</h2>

                                <p>
                                    Add a new asset to your inventory.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="close-modal"
                                onClick={closeAddForm}
                                disabled={saving}
                            >
                                ×
                            </button>

                        </div>

                        <form
                            className="asset-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="form-group">

                                <label htmlFor="itemName">
                                    Item Name
                                </label>

                                <input
                                    id="itemName"
                                    type="text"
                                    name="itemName"
                                    value={formData.itemName}
                                    onChange={handleChange}
                                    placeholder="e.g. Dell Latitude 5420"
                                    disabled={saving}
                                />

                            </div>

                            <div className="form-group">

                                <label htmlFor="category">
                                    Category
                                </label>

                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    disabled={saving}
                                >

                                    <option value="Laptop">
                                        Laptop
                                    </option>

                                    <option value="Chair">
                                        Chair
                                    </option>

                                    <option value="Telephone">
                                        Telephone
                                    </option>

                                    <option value="Other Equipment">
                                        Other Equipment
                                    </option>

                                </select>

                            </div>

                            <div className="form-group">

                                <label htmlFor="conditionStatus">
                                    Condition
                                </label>

                                <select
                                    id="conditionStatus"
                                    name="conditionStatus"
                                    value={formData.conditionStatus}
                                    onChange={handleChange}
                                    disabled={saving}
                                >

                                    <option value="GOOD">
                                        GOOD
                                    </option>

                                    <option value="DAMAGED">
                                        DAMAGED
                                    </option>

                                </select>

                            </div>

                            <div className="form-group">

                                <label htmlFor="assetStatus">
                                    Status
                                </label>

                                <select
                                    id="assetStatus"
                                    name="assetStatus"
                                    value={formData.assetStatus}
                                    onChange={handleChange}
                                    disabled={saving}
                                >

                                    <option value="IN_STOCK">
                                        IN STOCK
                                    </option>

                                    <option value="ASSIGNED">
                                        ASSIGNED
                                    </option>

                                    <option value="TO_BE_REPLACED">
                                        TO BE REPLACED
                                    </option>

                                    <option value="TO_BE_REMOVED">
                                        TO BE REMOVED
                                    </option>

                                </select>

                            </div>

                            <div className="form-actions">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={closeAddForm}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-btn"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save Asset"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Dashboard;