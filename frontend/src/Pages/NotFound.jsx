import { useNavigate } from "react-router-dom";

export default function NotFound() {
    const navigate = useNavigate();
    return (
        <div style={{
            minHeight: "100vh", background: "#111409",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Mono', monospace", color: "#6B7A3A",
            gap: 16
        }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 64, fontWeight: 800, color: "#3A4A1E", lineHeight: 1 }}>404</div>
            <div style={{ fontSize: 13, letterSpacing: "0.1em" }}>// page not found</div>
            <button
                onClick={() => navigate("/Home")}
                style={{
                    marginTop: 8, padding: "8px 20px",
                    background: "#3A4A1E", border: "1px solid #6B7A3A",
                    borderRadius: 6, color: "#C8CFA8",
                    fontFamily: "DM Mono, monospace", fontSize: 12,
                    cursor: "pointer", letterSpacing: "0.08em"
                }}>
                ← Go Home
            </button>
        </div>
    );
}
