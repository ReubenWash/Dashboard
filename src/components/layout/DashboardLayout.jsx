import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const NAV = [
  { to: "/", icon: "bi-grid-1x2", label: "Dashboard", section: "Navigation" },
  {
    to: "/lookup",
    icon: "bi-search",
    label: "User Lookup",
    section: "Navigation",
  },
  {
    to: "/moderate",
    icon: "bi-shield-check",
    label: "Moderate User",
    section: "Moderation",
  },
  {
    to: "/edit",
    icon: "bi-pencil-square",
    label: "Edit Profile",
    section: "Moderation",
  },
];

const PAGE_TITLES = {
  "/": "Dashboard",
  "/lookup": "User Lookup",
  "/moderate": "Moderate User",
  "/edit": "Edit Profile",
};

export default function DashboardLayout() {
  const { user, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const currentPath = window.location.pathname;
  const pageTitle = PAGE_TITLES[currentPath] ?? "Dashboard";
  const isAdmin = role !== "moderator";
  const displayName =
    user?.admin_name ?? user?.moderator_name ?? user?.name ?? "Staff";
  const avatarLetter = displayName[0]?.toUpperCase() ?? "S";

  function handleTopbarSearch(e) {
    if (e.key === "Enter" && searchVal.trim()) {
      navigate(`/lookup?uid=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
      setSidebarOpen(false);
    }
  }

  const sections = [...new Set(NAV.map((n) => n.section))];

  return (
    <div className="layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <img
            src="/logo.jpg"
            alt="eVibeX"
            style={{ height: 32, width: "auto" }}
          />
          <div>
            <div className="logo-text">eVibeX</div>
            <div className="logo-badge">
              {isAdmin ? "Admin Panel" : "Mod Panel"}
            </div>
          </div>
        </div>

        {sections.map((section) => (
          <div className="nav-section" key={section}>
            <div className="nav-label">{section}</div>
            {NAV.filter((n) => n.section === section).map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  `nav-item${isActive ? " active" : ""}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <i className={`bi ${n.icon} nav-icon`} />
                {n.label}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">{avatarLetter}</div>
            <div style={{ minWidth: 0 }}>
              <div
                className="admin-name"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName}
              </div>
              <div className="admin-role">
                <span
                  className={`role-pill ${isAdmin ? "admin" : "moderator"}`}
                >
                  {isAdmin ? "Admin" : "Moderator"}
                </span>
              </div>
            </div>
            <button
              className="icon-btn ms-auto"
              onClick={signOut}
              title="Logout"
              style={{ width: 26, height: 26, fontSize: 13 }}
            >
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="burger-btn"
              onClick={() => setSidebarOpen((o) => !o)}
            >
              <i className="bi bi-list" />
            </button>
            <span className="page-title">{pageTitle}</span>
            <span
              className={`role-pill ${isAdmin ? "admin" : "moderator"} d-none d-sm-inline-flex`}
            >
              {isAdmin ? "Admin" : "Moderator"}
            </span>
          </div>

          <div className="search-wrap">
            <i className="bi bi-search search-icon" />
            <input
              type="text"
              placeholder="Search user ID…"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={handleTopbarSearch}
            />
          </div>

          <div className="topbar-actions">
            <button
              className="icon-btn"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              <i
                className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon-stars"}`}
              />
            </button>
            <button className="icon-btn" onClick={signOut} title="Logout">
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
