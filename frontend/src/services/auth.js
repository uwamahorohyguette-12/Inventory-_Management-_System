// Demo-only credentials: frontend credentials are visible in the browser bundle.
// Replace this with backend authentication before using the app in production.
export const ADMIN_CREDENTIALS = {
    email: "hyguette@gmail.com",
    password: "1234",
};

export const AUTH_SESSION_KEY = "inventoryManagementAuthenticated";
export const SESSION_USER_KEY = "inventoryManagementUser";

export function getCurrentUser() {
    const storedUser = sessionStorage.getItem(SESSION_USER_KEY);

    if (storedUser) {
        try {
            return JSON.parse(storedUser);
        } catch {
            sessionStorage.removeItem(SESSION_USER_KEY);
        }
    }

    if (sessionStorage.getItem(AUTH_SESSION_KEY) === "true") {
        return {
            name: "HYGUETTE",
            email: ADMIN_CREDENTIALS.email,
            role: "admin",
        };
    }

    return null;
}
