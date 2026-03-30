import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";

export default function LoginPage() {
  const { signIn, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [loginRole, setLoginRole] = useState("admin");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    if (!name.trim()) {
      addToast("Enter your name.", "warning");
      return;
    }
    if (!password.trim()) {
      addToast("Enter your password.", "warning");
      return;
    }
    setLoading(true);
    try {
      await signIn(name.trim(), password, loginRole);
      navigate("/", { replace: true });
    } catch (err) {
      addToast(err.message || "Login failed.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      {/* Theme toggle top-right */}
      <button
        className="icon-btn"
        onClick={toggleTheme}
        title="Toggle theme"
        style={{ position: "absolute", top: 18, right: 18 }}
      >
        <i className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon-stars"}`} />
      </button>

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <img
            src="/logo.jpg"
            alt="eVibeX"
            style={{ height: 40, width: "auto" }}
          />
          <div>
            <div className="logo-text">eVibeX</div>
            <div className="logo-badge">Staff Portal</div>
          </div>
        </div>

        <h2
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          Welcome back
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 13.5,
            marginBottom: 24,
          }}
        >
          {loginRole === "admin"
            ? "Sign in to your admin account to continue."
            : "Sign in to your moderator account to continue."}
        </p>

        {/* Role switcher */}
        <div className="role-switcher">
          <button
            type="button"
            className={`role-btn admin-role-btn ${loginRole === "admin" ? "active" : ""}`}
            onClick={() => setLoginRole("admin")}
          >
            <i className="bi bi-shield-fill-check" /> Admin
          </button>
          <button
            type="button"
            className={`role-btn mod-role-btn ${loginRole === "moderator" ? "active" : ""}`}
            onClick={() => setLoginRole("moderator")}
          >
            <i className="bi bi-shield-half" /> Moderator
          </button>
        </div>

        <form onSubmit={handleLogin}>
          {/* Name */}
          <div className="mb-3">
            <label className="form-label">
              {loginRole === "admin" ? "Admin Name" : "Moderator Name"}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={
                loginRole === "admin" ? "" : ""
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="form-label">Password</label>
            <div className="position-relative">
              <input
                type={showPass ? "text" : "password"}
                className="form-control"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: "40px !important" }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <i
                  className="bi bi-arrow-clockwise me-2"
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Signing in…
              </>
            ) : (
              `Sign In as ${loginRole === "admin" ? "Admin" : "Moderator"}`
            )}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          Staff accounts are provisioned via the seed tool — no public signup.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
