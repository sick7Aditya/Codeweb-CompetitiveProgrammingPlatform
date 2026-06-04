import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [user, setUser] = useState(() => {
        const t = localStorage.getItem("token");
        return t ? parseJwt(t) : null;
    });

    // Listen for the event fired by the axios interceptor on 401
    // This keeps React state in sync when the token is cleared outside of React
    useEffect(() => {
        function handleLogout() {
            setToken(null);
            setUser(null);
        }
        window.addEventListener("auth:logout", handleLogout);
        return () => window.removeEventListener("auth:logout", handleLogout);
    }, []);

    function login(newToken) {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(parseJwt(newToken));
    }

    function logout() {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ token, user, setUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
