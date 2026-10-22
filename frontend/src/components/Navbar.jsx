import "./navbar.css";

function Navbar({ onMenuClick, onNotificationClick, user }) {
    const displayName = user?.name || "HYGUETTE";
    const userRole = user?.role === "admin" ? "System Admin" : user?.department || "Employee";

    return (
        <header className="navbar">

            <button
                type="button"
                className="mobile-menu-toggle"
                onClick={onMenuClick}
                aria-label="Toggle menu"
            >
                ☰
            </button>

            <div>
                <h3>Inventory Management</h3>
            </div>

            <div className="navbar-right">

                <button
                    type="button"
                    className="notification"
                    onClick={onNotificationClick}
                    aria-label="View notifications"
                >
                    🔔
                </button>

                <div className="profile">
                    <div className="profile-avatar">
                        {displayName.trim().charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <strong>{displayName}</strong>
                        <span>{userRole}</span>
                    </div>
                </div>

            </div>

        </header>
    );
}

export default Navbar;