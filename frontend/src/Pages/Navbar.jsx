import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    function handleLogout() {
        logout();
        navigate("/");
    }

    function getInitials(name) {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }

    const isAdmin = user?.role === "ADMIN";

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');

                .navbar {
                    display: flex;
                    align-items: center;
                    padding: 0 40px;
                    height: 60px;
                    background: #111409;
                    border-bottom: 1px solid rgba(106,122,58,0.25);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    font-family: 'DM Mono', monospace;
                }

                .navbar-logo {
                    font-family: 'Syne', sans-serif;
                    font-weight: 800;
                    font-size: 20px;
                    color: #F0EDE6;
                    letter-spacing: -0.5px;
                    flex-shrink: 0;
                    cursor: pointer;
                    text-decoration: none;
                }
                .navbar-logo span { color: #C8CFA8; }

                .navbar-links {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    list-style: none;
                    gap: 4px;
                    margin: 0;
                    padding: 0;
                }

                .navbar-links li a {
                    display: block;
                    padding: 6px 14px;
                    font-size: 12px;
                    font-weight: 400;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    text-decoration: none;
                    color: #4a5a28;
                    border-radius: 6px;
                    transition: color 0.18s, background 0.18s;
                }
                .navbar-links li a:hover {
                    color: #C8CFA8;
                    background: rgba(58,74,30,0.4);
                }
                .navbar-links li a.active {
                    color: #C8CFA8;
                    background: rgba(58,74,30,0.4);
                }

                .navbar-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-shrink: 0;
                }

                .navbar-avatar-btn {
                    width: 34px; height: 34px;
                    border-radius: 50%;
                    background: #3A4A1E;
                    border: 1.5px solid rgba(106,122,58,0.5);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 12px; font-weight: 500; color: #C8CFA8;
                    cursor: pointer; overflow: hidden;
                    transition: border-color 0.18s;
                    font-family: 'DM Mono', monospace;
                    padding: 0;
                }
                .navbar-avatar-btn:hover { border-color: #C8CFA8; }
                .navbar-avatar-btn img { width: 100%; height: 100%; object-fit: cover; }

                .navbar-dropdown-wrap { position: relative; }

                .navbar-dropdown {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    background: #161a0d;
                    border: 0.5px solid rgba(106,122,58,0.4);
                    border-radius: 10px;
                    min-width: 180px;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    z-index: 2000;
                    animation: dropIn 0.15s ease;
                }
                @keyframes dropIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .navbar-dropdown-header {
                    padding: 14px 16px;
                    border-bottom: 0.5px solid rgba(106,122,58,0.25);
                }
                .navbar-dropdown-name {
                    font-size: 13px; color: #F0EDE6; font-weight: 500;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .navbar-dropdown-email {
                    font-size: 10px; color: #3A4A1E;
                    margin-top: 2px; letter-spacing: 0.04em;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .navbar-dropdown-role {
                    display: inline-block;
                    font-size: 9px; padding: 2px 7px; border-radius: 20px;
                    margin-top: 6px; letter-spacing: 0.08em; text-transform: uppercase;
                    background: rgba(200,207,168,0.1); color: #C8CFA8;
                    border: 0.5px solid rgba(200,207,168,0.3);
                }
                .navbar-dropdown-role.admin-role {
                    background: rgba(240,198,116,0.12); color: #f0c674;
                    border-color: rgba(240,198,116,0.4);
                }

                .navbar-dropdown-item {
                    display: block; width: 100%;
                    padding: 11px 16px;
                    font-size: 12px; letter-spacing: 0.06em;
                    color: #6B7A3A; background: none; border: none;
                    text-align: left; cursor: pointer;
                    font-family: 'DM Mono', monospace;
                    transition: background 0.15s, color 0.15s;
                    text-decoration: none;
                }
                .navbar-dropdown-item:hover { background: rgba(58,74,30,0.4); color: #C8CFA8; }
                .navbar-dropdown-item.admin-item { color: #f0c674; }
                .navbar-dropdown-item.admin-item:hover { background: rgba(240,198,116,0.08); color: #f0c674; }
                .navbar-dropdown-divider {
                    height: 0.5px; background: rgba(106,122,58,0.2); margin: 0;
                }
                .navbar-dropdown-item.logout { color: #c97a6a; }
                .navbar-dropdown-item.logout:hover { background: rgba(201,122,106,0.08); color: #c97a6a; }

                .navbar-login-btn {
                    padding: 7px 18px;
                    background: transparent;
                    border: 0.5px solid rgba(106,122,58,0.5);
                    border-radius: 6px;
                    color: #6B7A3A;
                    font-family: 'DM Mono', monospace;
                    font-size: 12px;
                    letter-spacing: 0.08em;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.18s;
                }
                .navbar-login-btn:hover { border-color: #C8CFA8; color: #C8CFA8; }
            `}</style>

            <nav className="navbar">
                <Link to="/home" className="navbar-logo">
                    Code<span>Web</span>
                </Link>

                <ul className="navbar-links">
                    <li><Link to="/home">Home</Link></li>
                    <li><Link to="/Code">Code</Link></li>
                    <li><Link to="/Problems">Problems</Link></li>
                    <li><Link to="/Contest">Contest</Link></li>
                    <li><Link to="/About">About</Link></li> 
                </ul>

                <div className="navbar-right">
                    {user ? (
                        <div className="navbar-dropdown-wrap">
                            <button
                                className="navbar-avatar-btn"
                                onClick={() => setDropdownOpen(o => !o)}
                            >
                                {user.picture
                                    ? <img src={user.picture} alt="avatar" referrerPolicy="no-referrer" />
                                    : getInitials(user.name || user.sub)
                                }
                            </button>

                            {dropdownOpen && (
                                <div className="navbar-dropdown">
                                    <div className="navbar-dropdown-header">
                                        <div className="navbar-dropdown-name">
                                            {user.name || user.sub || "User"}
                                        </div>
                                        <div className="navbar-dropdown-email">
                                            {user.sub || ""}
                                        </div>
                                        <span className={`navbar-dropdown-role ${isAdmin ? "admin-role" : ""}`}>
                                            {user.role || "USER"}
                                        </span>
                                    </div>

                                    {isAdmin ? (
                                        <Link
                                            to="/admin"
                                            className="navbar-dropdown-item admin-item"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            ⚙ Admin Dashboard
                                        </Link>
                                    ) : (
                                        <Link
                                            to="/profile"
                                            className="navbar-dropdown-item"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            Profile
                                        </Link>
                                    )}

                                    <div className="navbar-dropdown-divider" />
                                    <button
                                        className="navbar-dropdown-item logout"
                                        onClick={() => { setDropdownOpen(false); handleLogout(); }}
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/" className="navbar-login-btn">Login</Link>
                    )}
                </div>
            </nav>
        </>
    );
}

export default Navbar;
