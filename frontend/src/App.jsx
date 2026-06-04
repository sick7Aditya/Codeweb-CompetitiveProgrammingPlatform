import Navbar from './Pages/Navbar';
import Home from './Home/Home';
import Code from './Contests/Code';
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Login from './Home/Login';
import Problem from './Contests/Problem';
import AuthCallback from './Pages/AuthCallback';
import Profile from './Home/Profile';
import Contest from './Contests/Contest';
import ProtectedRoute from './Home/ProtectedRoute';
import Admin from './Home/Admin';
import About from './Home/About';
import NotFound from './Pages/NotFound';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/"              element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected user routes */}
          <Route path="/Home"     element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/Code"     element={<ProtectedRoute><Code /></ProtectedRoute>} />
          <Route path="/Contest"  element={<ProtectedRoute><Contest /></ProtectedRoute>} />
          <Route path="/Problems" element={<ProtectedRoute><Problem /></ProtectedRoute>} />
          <Route path="/About"    element={<ProtectedRoute><About /></ProtectedRoute>} />
          <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin-only route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* 404 — no longer wraps Login in ProtectedRoute */}
          <Route path="/*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
