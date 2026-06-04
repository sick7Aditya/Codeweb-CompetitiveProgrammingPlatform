import { Navigate } from "react-router-dom";
import { useAuth } from "../Pages/AuthContext";

/**
 * Blocks unauthenticated users.
 * If `requiredRole` is provided (e.g. "ADMIN"), also blocks users without that role.
 * Uses a styled redirect instead of a blocking alert().
 */
export default function ProtectedRoute({ children, requiredRole }) {
    const { token, user } = useAuth();

    if (!token) {
        // Pass a state message so the login page can show a toast instead of alert()
        return <Navigate to="/" replace state={{ message: "Please log in to continue." }} />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/Home" replace />;
    }

    return children;
}
