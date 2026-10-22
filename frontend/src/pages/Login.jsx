import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ADMIN_CREDENTIALS,
    SESSION_USER_KEY,
} from "../services/auth";
import { employeeLogin } from "../services/api";
import { useFeedback } from "../components/useFeedback";
import "./Login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const showToast = useFeedback();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setSubmitting(true);

        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedEmail === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
            const adminUser = {
                name: "HYGUETTE",
                email: ADMIN_CREDENTIALS.email,
                role: "admin",
            };
            sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(adminUser));
            showToast("Signed in successfully. Welcome, HYGUETTE.");
            navigate("/dashboard", { replace: true });
            setSubmitting(false);
            return;
        }

        try {
            const employeeUser = await employeeLogin({ email: normalizedEmail, password });

            sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(employeeUser));
            showToast(`Welcome, ${employeeUser.name}.`);
            navigate("/dashboard", { replace: true });
        } catch (error) {
            console.error("Could not sign in:", error);
            setMessage(error.response?.status === 401
                ? "Incorrect email or password."
                : "Could not connect to the server. Make sure the backend is running and try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="login-page">
            <section className="login-card" aria-labelledby="login-title">
                <div className="login-brand">
                    <div className="login-brand-icon" aria-hidden="true">I</div>
                    <div>
                        <strong>Invento</strong>
                        <span>Asset Management</span>
                    </div>
                </div>

                <div className="login-heading">
                    <p className="login-eyebrow">INVENTORY WORKSPACE</p>
                    <h1 id="login-title">Welcome back</h1>
                    <p>Sign in to view your inventory workspace.</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label htmlFor="login-email">Email address</label>
                        <input
                            id="login-email"
                            type="email"
                            autoComplete="username"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            disabled={submitting}
                            required
                        />
                    </div>

                    {message && (
                        <p className="login-message" role="alert">{message}</p>
                    )}

                    <button className="login-submit" type="submit" disabled={submitting}>
                        {submitting ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="login-auth-note">
                    Admin: hyguette@gmail.com. Employees: use the email and password set by your administrator.
                </p>
            </section>
        </main>
    );
}

export default Login;
