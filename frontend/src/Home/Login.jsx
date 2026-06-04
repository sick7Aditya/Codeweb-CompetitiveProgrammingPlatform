import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../ConnectingBackend/axios";
import { useAuth } from "../Pages/AuthContext";
import Navbar from "../Pages/Navbar";
import { validateLoginForm, LIMITS } from "../utils/formValidation";

export default function Login() {
    const [mode, setMode] = useState("Login");
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const [errors, setErrors] = useState({});

    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // Show message passed by ProtectedRoute redirect (replaces alert())
    const redirectMessage = location.state?.message || null;

    function update(field, val) {
        setForm(f => ({ ...f, [field]: val }));
        setErrors(e => ({ ...e, [field]: "" }));
    }

    async function handleSubmit() {
        const e = validateLoginForm(form, mode);
        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }

        try {
            if (mode === "Login") {
                const res = await api.post("/api/auth/login", {
                    email: form.email,
                    password: form.password
                });
                login(res.data.token);
                // FIX: was "/home" — route is defined as "/Home" (capital H)
                navigate("/Home");
            } else {
                const res = await api.post("/api/auth/register", {
                    name: form.name,
                    email: form.email,
                    password: form.password
                });
                login(res.data.token);
                navigate("/Home");
            }
        } catch (err) {
            setErrors({ general: err.response?.data?.error || "Something went wrong!" });
        }
    }

    function handleGoogle() {
        const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
        window.location.href = `${base}/oauth2/authorization/google`;
    }

    function switchMode(m) {
        setMode(m);
        setErrors({});
        setForm({ name: "", email: "", password: "", confirm: "" });
    }

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');

        .Login {
            min-height: calc(100vh - 60px);
            background: #111409;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'DM Mono', monospace;
            padding: 40px 20px;
        }

        .login-card {
            width: 100%;
            max-width: 400px;
            background: #161a0d;
            border: 0.5px solid rgba(106,122,58,0.35);
            border-radius: 12px;
            padding: 40px 36px;
        }

        .login-logo {
            font-family: 'Syne', sans-serif;
            font-weight: 800;
            font-size: 22px;
            color: #F0EDE6;
            letter-spacing: -0.5px;
            margin-bottom: 6px;
            text-align: center;
        }
        .login-logo span { color: #C8CFA8; }

        .login-subtitle {
            text-align: center;
            font-size: 11px;
            color: #3A4A1E;
            letter-spacing: 0.08em;
            margin-bottom: 28px;
        }

        .login-tabs {
            display: flex;
            background: #111409;
            border: 0.5px solid rgba(106,122,58,0.25);
            border-radius: 7px;
            padding: 3px;
            margin-bottom: 24px;
        }
        .login-tab {
            flex: 1;
            padding: 8px;
            background: transparent;
            border: none;
            border-radius: 5px;
            color: #3A4A1E;
            font-family: 'DM Mono', monospace;
            font-size: 11px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.18s;
        }
        .login-tab.active {
            background: #3A4A1E;
            color: #C8CFA8;
        }

        .login-field { margin-bottom: 16px; }
        .login-label {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #4a5a28;
            margin-bottom: 6px;
        }
        .login-input {
            width: 100%;
            padding: 10px 14px;
            background: #111409;
            border: 0.5px solid rgba(106,122,58,0.35);
            border-radius: 7px;
            color: #F0EDE6;
            font-family: 'DM Mono', monospace;
            font-size: 13px;
            outline: none;
            transition: border-color 0.18s;
            box-sizing: border-box;
        }
        .login-input::placeholder { color: #2a3516; }
        .login-input:focus { border-color: #6B7A3A; }
        .login-input.err { border-color: #c97a6a; }

        .login-error {
            font-size: 10px;
            color: #c97a6a;
            margin-top: 4px;
            letter-spacing: 0.04em;
        }

        .login-btn {
            width: 100%;
            padding: 11px;
            background: #3A4A1E;
            border: 1px solid #6B7A3A;
            border-radius: 7px;
            color: #C8CFA8;
            font-family: 'DM Mono', monospace;
            font-size: 12px;
            font-weight: 500;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            cursor: pointer;
            margin-top: 8px;
            transition: all 0.2s;
        }
        .login-btn:hover { background: #6B7A3A; color: #111409; }

        .login-divider {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 20px 0;
        }
        .login-divider-line {
            flex: 1;
            height: 0.5px;
            background: rgba(106,122,58,0.25);
        }
        .login-divider-text {
            font-size: 10px;
            color: #3A4A1E;
            letter-spacing: 0.1em;
        }

        .login-google-btn {
            width: 100%;
            padding: 10px;
            background: transparent;
            border: 0.5px solid rgba(106,122,58,0.35);
            border-radius: 7px;
            color: #6B7A3A;
            font-family: 'DM Mono', monospace;
            font-size: 12px;
            letter-spacing: 0.08em;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.18s;
        }
        .login-google-btn:hover { border-color: #C8CFA8; color: #C8CFA8; }

        .login-general-err {
            background: rgba(201,122,106,0.1);
            border: 0.5px solid rgba(201,122,106,0.3);
            border-radius: 6px;
            padding: 10px 14px;
            font-size: 12px;
            color: #c97a6a;
            margin-bottom: 16px;
            letter-spacing: 0.04em;
        }

        .login-redirect-msg {
            background: rgba(106,122,58,0.1);
            border: 0.5px solid rgba(106,122,58,0.3);
            border-radius: 6px;
            padding: 10px 14px;
            font-size: 12px;
            color: #C8CFA8;
            margin-bottom: 16px;
            letter-spacing: 0.04em;
        }
        `}</style>

            <div className="Login">
                <div className="login-card">
                    <div className="login-logo">Code<span>Web</span></div>
                    <div className="login-subtitle">
                        {mode === "Login" ? "// welcome back" : "// create your account"}
                    </div>

                    <div className="login-tabs">
                        <button
                            className={`login-tab ${mode === "Login" ? "active" : ""}`}
                            onClick={() => switchMode("Login")}>
                            Login
                        </button>
                        <button
                            className={`login-tab ${mode === "Sign" ? "active" : ""}`}
                            onClick={() => switchMode("Sign")}>
                            Register
                        </button>
                    </div>

                    {redirectMessage && (
                        <div className="login-redirect-msg">{redirectMessage}</div>
                    )}

                    {errors.general && (
                        <div className="login-general-err">{errors.general}</div>
                    )}

                    {mode === "Sign" && (
                        <div className="login-field">
                            <label className="login-label">Name</label>
                            <input
                                className={`login-input ${errors.name ? "err" : ""}`}
                                placeholder="your name"
                                value={form.name}
                                maxLength={LIMITS.nameMax}
                                autoComplete="name"
                                onChange={e => update("name", e.target.value)}
                            />
                            {errors.name && <div className="login-error">{errors.name}</div>}
                        </div>
                    )}

                    <div className="login-field">
                        <label className="login-label">Email</label>
                        <input
                            className={`login-input ${errors.email ? "err" : ""}`}
                            placeholder="you@example.com"
                            type="email"
                            value={form.email}
                            maxLength={254}
                            autoComplete="email"
                            onChange={e => update("email", e.target.value)}
                        />
                        {errors.email && <div className="login-error">{errors.email}</div>}
                    </div>

                    <div className="login-field">
                        <label className="login-label">Password</label>
                        <input
                            className={`login-input ${errors.password ? "err" : ""}`}
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            maxLength={LIMITS.passwordMax}
                            autoComplete={mode === "Login" ? "current-password" : "new-password"}
                            onChange={e => update("password", e.target.value)}
                        />
                        {errors.password && <div className="login-error">{errors.password}</div>}
                    </div>

                    {mode === "Sign" && (
                        <div className="login-field">
                            <label className="login-label">Confirm Password</label>
                            <input
                                className={`login-input ${errors.confirm ? "err" : ""}`}
                                type="password"
                                placeholder="••••••••"
                                value={form.confirm}
                                maxLength={LIMITS.passwordMax}
                                autoComplete="new-password"
                                onChange={e => update("confirm", e.target.value)}
                            />
                            {errors.confirm && <div className="login-error">{errors.confirm}</div>}
                        </div>
                    )}

                    <button className="login-btn" onClick={handleSubmit}>
                        {mode === "Login" ? "Login" : "Create Account"}
                    </button>

                    <div className="login-divider">
                        <div className="login-divider-line" />
                        <span className="login-divider-text">or</span>
                        <div className="login-divider-line" />
                    </div>

                    <button className="login-google-btn" onClick={handleGoogle}>
                        <svg width="16" height="16" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>
                </div>
            </div>
        </>
    );
}
