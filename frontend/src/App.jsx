import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Employee from "./pages/Employee";
import Requests from "./pages/Requests";
import Assignments from "./pages/Assignments";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import { FeedbackProvider } from "./components/Feedback";
import { useFeedback } from "./components/useFeedback";
import { AUTH_SESSION_KEY, SESSION_USER_KEY, getCurrentUser } from "./services/auth";
import "./App.css";

function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const showToast = useFeedback();
    const currentUser = getCurrentUser();
    const isAdmin = currentUser?.role === "admin";

    const closeSidebar = () => setSidebarOpen(false);

    const handleLogout = () => {
        const confirmed = window.confirm("Are you sure you want to log out?");

        if (!confirmed) {
            return;
        }

        ["token", "authToken", "accessToken", "user", "currentUser", AUTH_SESSION_KEY, SESSION_USER_KEY].forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        closeSidebar();
        showToast("You have been logged out.");
        navigate("/login", { replace: true });
    };

    if (location.pathname === "/login") {
        if (currentUser) {
            return <Navigate to="/dashboard" replace />;
        }
        return <Login />;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className={`app ${sidebarOpen ? "sidebar-open" : ""}`}>
            <div
                className={`sidebar-backdrop ${sidebarOpen ? "visible" : ""}`}
                onClick={closeSidebar}
            />

            <Sidebar
                isOpen={sidebarOpen}
                onClose={closeSidebar}
                onLogout={handleLogout}
                user={currentUser}
                isAdmin={isAdmin}
            />

            <div className="main-content">
                <Navbar
                    onMenuClick={() => setSidebarOpen((previous) => !previous)}
                    onNotificationClick={() => showToast("You have no new notifications.")}
                    user={currentUser}
                />

                <Routes>
                    <Route
                        path="/"
                        element={<Navigate to="/assets" replace />}
                    />

                    <Route
                        path="/dashboard"
                        element={isAdmin ? <Dashboard /> : <UserDashboard user={currentUser} />}
                    />

                    {isAdmin && (
                        <>
                            <Route path="/assets" element={<Assets />} />
                            <Route path="/employees" element={<Employee />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/requests" element={<Requests />} />
                            <Route path="/assignments" element={<Assignments />} />
                            <Route path="/reports" element={<Reports />} />
                        </>
                    )}

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </div>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <FeedbackProvider>
                <AppLayout />
            </FeedbackProvider>
        </BrowserRouter>
    );
}

export default App;