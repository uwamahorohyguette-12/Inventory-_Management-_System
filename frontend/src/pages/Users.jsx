import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getEmployees } from "../services/api";
import { useFeedback } from "../components/useFeedback";
import "./Users.css";

function initials(name = "") {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "?";
}

function Users() {
    const showToast = useFeedback();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function loadEmployees() {
            try {
                setError("");
                const data = await getEmployees();
                if (!cancelled) {
                    setEmployees(Array.isArray(data) ? data : []);
                    if (refreshKey > 0) {
                        showToast("User directory refreshed.");
                    }
                }
            } catch (loadError) {
                console.error("Could not load user directory:", loadError);
                if (!cancelled) {
                    setError("Could not load the user directory. Check that the backend is running.");
                    if (refreshKey > 0) {
                        showToast("Could not refresh the user directory.", "error");
                    }
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
    }, [refreshKey, showToast]);

    const departments = useMemo(
        () => [...new Set(employees.map((employee) => employee.department?.trim() || "Unassigned"))]
            .sort((first, second) => first.localeCompare(second)),
        [employees]
    );

    const departmentCounts = useMemo(() => {
        const counts = new Map();
        employees.forEach((employee) => {
            const department = employee.department?.trim() || "Unassigned";
            counts.set(department, (counts.get(department) || 0) + 1);
        });
        return [...counts.entries()].sort((first, second) => second[1] - first[1]);
    }, [employees]);

    const visibleEmployees = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        return employees.filter((employee) => {
            const department = employee.department?.trim() || "Unassigned";
            const matchesDepartment = departmentFilter === "all" || department === departmentFilter;
            const matchesSearch = !normalizedSearch
                || employee.fullName?.toLowerCase().includes(normalizedSearch)
                || employee.email?.toLowerCase().includes(normalizedSearch)
                || department.toLowerCase().includes(normalizedSearch);
            return matchesDepartment && matchesSearch;
        });
    }, [employees, search, departmentFilter]);

    const handleRefresh = () => {
        setLoading(true);
        setRefreshKey((current) => current + 1);
    };

    return (
        <main className="users-page">
            <header className="users-header">
                <div>
                    <span className="users-eyebrow">PEOPLE DIRECTORY</span>
                    <h1>Users</h1>
                    <p>Browse employees registered in your inventory system.</p>
                </div>
                <div className="users-header-actions">
                    <button className="users-refresh-btn" type="button" onClick={handleRefresh} disabled={loading}>
                        <span aria-hidden="true">↻</span> {loading ? "Refreshing..." : "Refresh"}
                    </button>
                    <Link className="users-manage-link" to="/employees">Manage employees <span aria-hidden="true">→</span></Link>
                </div>
            </header>

            <div className="users-stats">
                <article className="users-stat">
                    <span className="users-stat-icon users-stat-blue" aria-hidden="true">♙</span>
                    <div><span>Registered people</span><strong>{loading ? "—" : employees.length}</strong></div>
                    <small>Employee records</small>
                </article>
                <article className="users-stat">
                    <span className="users-stat-icon users-stat-green" aria-hidden="true">⌂</span>
                    <div><span>Departments</span><strong>{loading ? "—" : departments.length}</strong></div>
                    <small>Across the organization</small>
                </article>
                <article className="users-stat">
                    <span className="users-stat-icon users-stat-orange" aria-hidden="true">⌕</span>
                    <div><span>Showing</span><strong>{loading ? "—" : visibleEmployees.length}</strong></div>
                    <small>Matching your filters</small>
                </article>
            </div>

            {error && <div className="users-error" role="alert">{error}</div>}

            <section className="users-directory" aria-labelledby="directory-title">
                <div className="users-directory-heading">
                    <div>
                        <h2 id="directory-title">Employee directory</h2>
                        <p>Search by name, email, or department.</p>
                    </div>
                    <div className="users-filters">
                        <label className="users-search">
                            <span className="visually-hidden">Search people</span>
                            <span aria-hidden="true">⌕</span>
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search people..."
                            />
                        </label>
                        <label className="users-department-filter">
                            <span className="visually-hidden">Filter by department</span>
                            <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                                <option value="all">All departments</option>
                                {departments.map((department) => <option key={department} value={department}>{department}</option>)}
                            </select>
                        </label>
                    </div>
                </div>

                {loading ? (
                    <div className="users-empty">Loading people...</div>
                ) : visibleEmployees.length ? (
                    <div className="users-table-scroll">
                        <table className="users-table">
                            <thead>
                                <tr><th scope="col">Person</th><th scope="col">Email</th><th scope="col">Department</th><th scope="col">Record ID</th></tr>
                            </thead>
                            <tbody>
                                {visibleEmployees.map((employee, index) => (
                                    <tr key={employee.id}>
                                        <td>
                                            <div className="directory-person">
                                                <span className={`directory-avatar directory-avatar-${index % 5}`}>{initials(employee.fullName)}</span>
                                                <strong>{employee.fullName}</strong>
                                            </div>
                                        </td>
                                        <td><a className="directory-email" href={`mailto:${employee.email}`}>{employee.email}</a></td>
                                        <td><span className="department-tag">{employee.department?.trim() || "Unassigned"}</span></td>
                                        <td className="directory-id">#{employee.id}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="users-empty">
                        <strong>{employees.length ? "No matching people" : "No people registered yet"}</strong>
                        <span>{employees.length ? "Try a different name or department filter." : "Add employee records to populate this directory."}</span>
                        {!employees.length && <Link to="/employees">Go to employees <span aria-hidden="true">→</span></Link>}
                    </div>
                )}
            </section>

            <section className="department-overview" aria-labelledby="department-overview-title">
                <div className="department-overview-header">
                    <div><h2 id="department-overview-title">Department overview</h2><p>People grouped by department</p></div>
                    <span className="department-count">{loading ? "..." : `${departmentCounts.length} groups`}</span>
                </div>
                {departmentCounts.length ? (
                    <div className="department-overview-list">
                        {departmentCounts.map(([department, count]) => (
                            <button
                                className={`department-overview-item ${departmentFilter === department ? "selected" : ""}`}
                                key={department}
                                type="button"
                                onClick={() => setDepartmentFilter((current) => current === department ? "all" : department)}
                                aria-pressed={departmentFilter === department}
                            >
                                <span className="department-unit-icon" aria-hidden="true">{initials(department)}</span>
                                <span className="department-unit-name">{department}</span>
                                <strong>{count}</strong>
                                <span className="department-unit-label">{count === 1 ? "person" : "people"}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="department-empty">Department data will appear when employee records are available.</p>
                )}
            </section>
            <p className="users-data-note">This directory shows employee records. It does not create or manage login accounts.</p>
        </main>
    );
}

export default Users;