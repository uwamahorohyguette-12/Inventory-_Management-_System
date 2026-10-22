import { NavLink } from "react-router-dom";
import "./sidebar.css";

function Sidebar({ isOpen, onClose, onLogout, user, isAdmin }) {
    const displayName = user?.name || "HYGUETTE";
    const userRole = isAdmin ? "System Admin" : user?.department || "Employee";

    return (
        <aside className={`sidebar ${isOpen ? "open" : ""}`}>

            <div className="logo">
                <div className="logo-icon">
                    I
                </div>

                <div>
                    <h2>Invento</h2>
                    <span>Asset Management</span>
                </div>
            </div>

            <div className="menu-title">{isAdmin ? "MAIN MENU" : "MY WORKSPACE"}</div>

            <nav>
                <NavLink to="/dashboard" onClick={onClose}>
                    📊 {isAdmin ? "Dashboard" : "My Dashboard"}
                </NavLink>

                {isAdmin && (
                    <>
                        <NavLink to="/assets" onClick={onClose}>💻 Assets</NavLink>
                        <NavLink to="/employees" onClick={onClose}>👥 Employees</NavLink>
                        <NavLink to="/users" onClick={onClose}>👤 Users</NavLink>
                        <NavLink to="/requests" onClick={onClose}>📋 Requests</NavLink>
                    </>
                )}
            </nav>

            {isAdmin && (
                <>
                    <div className="menu-title">MANAGEMENT</div>
                    <nav>
                        <NavLink to="/assignments" onClick={onClose}>📦 Assignments</NavLink>
                        <NavLink to="/reports" onClick={onClose}>📈 Reports</NavLink>
                    </nav>
                </>
            )}

            <div className="sidebar-user">

                <div className="user-avatar">
                    {displayName.trim().charAt(0).toUpperCase()}
                </div>

                <div>
                    <strong>{displayName}</strong>
                    <span>{userRole}</span>
                </div>

                <button
                    type="button"
                    className="logout-btn"
                    onClick={onLogout}
                    aria-label={`Log out of ${displayName}'s account`}
                >
                    <span aria-hidden="true">↪</span>
                    <span>Logout</span>
                </button>

            </div>

        </aside>
    );
}

export default Sidebar;