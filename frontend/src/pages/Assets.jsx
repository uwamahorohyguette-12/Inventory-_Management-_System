import { useEffect, useState } from "react";
import {
    getAssets,
    createAsset,
    updateAsset,
    deleteAsset,
} from "../services/api";
import { useFeedback } from "../components/useFeedback";
import "./Assets.css";

const initialForm = {
    itemName: "",
    category: "Laptop",
    conditionStatus: "GOOD",
    assetStatus: "IN_STOCK",
};

function Assets() {
    const showToast = useFeedback();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        let cancelled = false;

        async function loadAssets() {
            try {
                const data = await getAssets();
                if (!cancelled) {
                    setAssets(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error(error);
                if (!cancelled) {
                    setError("Could not load assets.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadAssets();
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

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.itemName.trim()) {
            setError("Item name is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            if (editingId) {
                const updatedAsset = await updateAsset(
                    editingId,
                    formData
                );

                setAssets((previous) =>
                    previous.map((asset) =>
                        asset.id === editingId
                            ? updatedAsset
                            : asset
                    )
                );
                    showToast("Asset updated successfully.");
            } else {
                const newAsset = await createAsset(formData);

                setAssets((previous) => [
                    ...previous,
                    newAsset,
                ]);
                    showToast("Asset added successfully.");
            }

            setFormData(initialForm);
            setEditingId(null);
            setShowForm(false);

        } catch (error) {
            console.error(error);
            setError("Could not save asset.");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (asset) => {
        setFormData({
            itemName: asset.itemName,
            category: asset.category,
            conditionStatus: asset.conditionStatus,
            assetStatus: asset.assetStatus,
        });

        setEditingId(asset.id);
        setShowForm(true);
        setError("");
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this asset?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteAsset(id);

            setAssets((previous) =>
                previous.filter((asset) => asset.id !== id)
            );
            showToast("Asset deleted successfully.");
        } catch (error) {
            console.error(error);
            setError("Could not delete asset.");
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(initialForm);
        setError("");
    };

    return (
        <div className="assets-page">

            <div className="assets-header">
                <div>
                    <h1>Assets</h1>
                    <p>Manage all inventory and company assets.</p>
                </div>

                <button
                    className="add-asset-btn"
                    onClick={() => {
                        setFormData(initialForm);
                        setEditingId(null);
                        setError("");
                        setShowForm(true);
                    }}
                >
                    + Add Asset
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <br />

            <div className="assets-table-container">

                {loading ? (
                    <div className="empty-assets">
                        Loading assets...
                    </div>
                ) : assets.length === 0 ? (
                    <div className="empty-assets">
                        No assets found.
                    </div>
                ) : (
                    <table className="assets-table">

                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Condition</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {assets.map((asset) => (
                            <tr key={asset.id}>

                                <td>{asset.id}</td>

                                <td>
                                    <strong>
                                        {asset.itemName}
                                    </strong>
                                </td>

                                <td>
                                    {asset.category}
                                </td>

                                <td>
                                        <span className="condition-badge">
                                            {asset.conditionStatus}
                                        </span>
                                </td>

                                <td>
                                        <span className="status-badge">
                                            {asset.assetStatus}
                                        </span>
                                </td>

                                <td>
                                    <button
                                        className="action-btn edit-btn"
                                        onClick={() =>
                                            handleEdit(asset)
                                        }
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="action-btn delete-btn"
                                        onClick={() =>
                                            handleDelete(asset.id)
                                        }
                                    >
                                        Delete
                                    </button>
                                </td>

                            </tr>
                        ))}
                        </tbody>

                    </table>
                )}

            </div>

            {showForm && (
                <div className="modal-overlay">

                    <div className="asset-modal">

                        <h2>
                            {editingId
                                ? "Edit Asset"
                                : "Add Asset"}
                        </h2>

                        <form
                            className="asset-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="form-group">
                                <label>
                                    Item Name
                                </label>

                                <input
                                    type="text"
                                    name="itemName"
                                    value={formData.itemName}
                                    onChange={handleChange}
                                    placeholder="Enter item name"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Category
                                </label>

                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
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
                                <label>
                                    Condition
                                </label>

                                <select
                                    name="conditionStatus"
                                    value={formData.conditionStatus}
                                    onChange={handleChange}
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
                                <label>
                                    Status
                                </label>

                                <select
                                    name="assetStatus"
                                    value={formData.assetStatus}
                                    onChange={handleChange}
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
                                    onClick={closeForm}
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
                                        : editingId
                                            ? "Update Asset"
                                            : "Add Asset"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Assets;