import { useEffect, useState } from "react";
import {
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
} from "../services/api";
import { useFeedback } from "../components/useFeedback";

const initialForm = {
    fullName: "",
    email: "",
    department: "IT",
    password: "",
};

function Employee() {
    const showToast = useFeedback();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialForm);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadEmployees() {
            try {
                const data = await getEmployees();
                if (!cancelled) {
                    setEmployees(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setError("Could not load employees.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadEmployees();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.fullName.trim() || !formData.email.trim()) {
            setError("Full name and email are required.");
            return;
        }

        if ((!editingId && !formData.password.trim()) || (formData.password && !/^\d{4}$/.test(formData.password))) {
            setError(editingId
            ? "A new password must be exactly 4 digits."
            : "Set an employee password with exactly 4 digits.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            if (editingId) {
                const updated = await updateEmployee(editingId, formData);
                setEmployees((previous) =>
                    previous.map((employee) =>
                        employee.id === editingId ? updated : employee
                    )
                );
                showToast("Employee updated successfully.");
            } else {
                const newEmployee = await createEmployee(formData);
                setEmployees((previous) => [...previous, newEmployee]);
                showToast("Employee added successfully.");
            }

            setFormData(initialForm);
            setEditingId(null);
            setShowForm(false);
        } catch (err) {
            console.error(err);
            setError("Could not save employee.");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (employee) => {
        setFormData({
            fullName: employee.fullName,
            email: employee.email,
            department: employee.department,
            password: "",
        });
        setEditingId(employee.id);
        setShowForm(true);
        setError("");
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm("Delete this employee?");
        if (!confirmed) return;

        try {
            await deleteEmployee(id);
            setEmployees((previous) => previous.filter((employee) => employee.id !== id));
            showToast("Employee deleted successfully.");
        } catch (err) {
            console.error(err);
            setError("Could not delete employee.");
        }
    };

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h1>Employees</h1>
                    <p>Manage staff members and departments.</p>
                </div>

                <button
                    type="button"
                    className="add-asset-btn"
                    onClick={() => {
                        setFormData(initialForm);
                        setEditingId(null);
                        setShowForm(true);
                        setError("");
                    }}
                >
                    + Add Employee
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="assets-table-container">
                {loading ? (
                    <div className="empty-assets">Loading employees...</div>
                ) : employees.length === 0 ? (
                    <div className="empty-assets">No employees found.</div>
                ) : (
                    <table className="assets-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((employee) => (
                                <tr key={employee.id}>
                                    <td>{employee.id}</td>
                                    <td>{employee.fullName}</td>
                                    <td>{employee.email}</td>
                                    <td>{employee.department}</td>
                                    <td>
                                        <span className={`employee-login-status ${employee.loginEnabled ? "login-enabled" : "login-not-set"}`}>
                                            {employee.loginEnabled ? "Enabled" : "Password not set"}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={() => handleEdit(employee)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={() => handleDelete(employee.id)}
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
                        <div className="modal-header">
                            <div>
                                <h2>{editingId ? "Edit Employee" : "Add Employee"}</h2>
                            </div>
                            <button
                                type="button"
                                className="close-modal"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                    setFormData(initialForm);
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form className="asset-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="fullName">Full Name</label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="employee@example.com"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="department">Department</label>
                                <input
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    placeholder="IT, Admin, Finance"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="employeePassword">{editingId ? "Reset password" : "Login password"}</label>
                                <input
                                    id="employeePassword"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder={editingId ? "Leave blank to keep current password" : "4 digits"}
                                    inputMode="numeric"
                                    pattern="[0-9]{4}"
                                    minLength="4"
                                    maxLength="4"
                                    autoComplete="new-password"
                                    required={!editingId}
                                />
                                {editingId && <small className="employee-password-hint">Leave blank to keep the current password.</small>}
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                        setFormData(initialForm);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn" disabled={saving}>
                                    {saving ? "Saving..." : editingId ? "Update Employee" : "Save Employee"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Employee;
