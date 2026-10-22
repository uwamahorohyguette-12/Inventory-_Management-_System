import { useContext } from "react";
import { FeedbackContext } from "./FeedbackContext";

export function useFeedback() {
    const showToast = useContext(FeedbackContext);

    if (!showToast) {
        throw new Error("useFeedback must be used inside FeedbackProvider.");
    }

    return showToast;
}