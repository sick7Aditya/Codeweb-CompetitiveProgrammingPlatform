import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            login(token);
            // FIX: was "/home" — route is defined as "/Home" (capital H)
            navigate("/Home");
        } else {
            navigate("/");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div style={{
            minHeight: "100vh", background: "#111409",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Mono', monospace", color: "#6B7A3A", fontSize: 13,
            letterSpacing: "0.08em"
        }}>
            logging you in...
        </div>
    );
}
