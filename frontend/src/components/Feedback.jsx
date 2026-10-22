import { useCallback, useEffect, useRef, useState } from "react";
import { FeedbackContext } from "./FeedbackContext";

export function FeedbackProvider({ children }) {
    const [toast, setToast] = useState(null);
    const timerRef = useRef(null);

    const showToast = useCallback((message, type = "success") => {
        window.clearTimeout(timerRef.current);
        setToast({ id: Date.now(), message, type });
        timerRef.current = window.setTimeout(() => setToast(null), 4000);
    }, []);

    useEffect(() => () => window.clearTimeout(timerRef.current), []);

    return (
        <FeedbackContext.Provider value={showToast}>
            {children}
            <div className="toast-container" aria-live="polite" aria-atomic="true">
                {toast && (
                    <div
                        key={toast.id}
                        className={`app-toast app-toast-${toast.type}`}
                        role={toast.type === "error" ? "alert" : "status"}
                    >
                        <span className="toast-icon" aria-hidden="true">
                            {toast.type === "error" ? "!" : "✓"}
                        </span>
                        <span className="toast-message">{toast.message}</span>
                        <button
                            type="button"
                            className="toast-dismiss"
                            aria-label="Dismiss message"
                            onClick={() => {
                                window.clearTimeout(timerRef.current);
                                setToast(null);
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>
        </FeedbackContext.Provider>
    );
}