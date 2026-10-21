import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  ShieldIcon,
  KeyIcon,
  UsersIcon,
  ActivityIcon,
  SunIcon,
  MoonIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  BellIcon,
  LayersIcon,
} from "./Icons";

export default function Navbar({
  activeTab,
  setActiveTab,
  userEmail,
  userRole,
  credentialsCount = 0,
  sharedCount = 0,
  unreadAlertsCount = 0,
  onLogout,
  goToDashboard,
}) {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (email) => {
    if (!email) return "U";
    return email.slice(0, 2).toUpperCase();
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sv-navbar">
      <div className="nav-container">
        {/* Left: Brand + Desktop Navigation */}
        <div className="nav-left">
          <div
            className="nav-brand"
            style={{ cursor: "pointer" }}
            onClick={() => (goToDashboard ? goToDashboard() : handleTabClick("vault"))}
            title="Return to Starting Dashboard"
          >
            <div className="nav-brand-icon">
              <ShieldIcon size={20} />
            </div>
            <span>SecureVault</span>
          </div>

          <nav className="nav-tabs" aria-label="Main Navigation">
            {goToDashboard && (
              <button
                type="button"
                className="nav-tab-btn"
                onClick={goToDashboard}
                title="View Platform Showcase & Starting Dashboard"
              >
                <LayersIcon size={16} />
                <span>Overview</span>
              </button>
            )}

            <button
              type="button"
              className={`nav-tab-btn ${activeTab === "vault" ? "active" : ""}`}
              onClick={() => handleTabClick("vault")}
            >
              <KeyIcon size={16} />
              <span>Vault</span>
              {credentialsCount > 0 && <span className="nav-tab-count">{credentialsCount}</span>}
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${activeTab === "sharing" ? "active" : ""}`}
              onClick={() => handleTabClick("sharing")}
            >
              <UsersIcon size={16} />
              <span>Sharing & Teams</span>
              {sharedCount > 0 && <span className="nav-tab-count">{sharedCount}</span>}
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${activeTab === "security" ? "active" : ""}`}
              onClick={() => handleTabClick("security")}
            >
              <ActivityIcon size={16} />
              <span>Security Center</span>
            </button>

            {userRole === "ADMINISTRATOR" && (
              <button
                type="button"
                className={`nav-tab-btn ${activeTab === "admin" ? "active" : ""}`}
                onClick={() => handleTabClick("admin")}
                style={{ color: activeTab === "admin" ? "#f87171" : undefined }}
              >
                <span>⚡ Admin Console</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right: Actions, Theme, User, Logout */}
        <div className="nav-right">
          {/* Unread Alerts indicator */}
          {unreadAlertsCount > 0 && (
            <button
              type="button"
              className="btn-icon"
              title={`${unreadAlertsCount} unread security alert(s)`}
              onClick={() => handleTabClick("security")}
              style={{
                position: "relative",
                background: "rgba(239, 68, 68, 0.12)",
                color: "var(--danger)",
                borderColor: "rgba(239, 68, 68, 0.3)",
              }}
            >
              <BellIcon size={17} />
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "var(--danger)",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: "bold",
                  borderRadius: "9999px",
                  padding: "1px 5px",
                  lineHeight: "1.2",
                }}
              >
                {unreadAlertsCount}
              </span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>

          {/* User Profile Pill */}
          <div className="user-profile-pill" title={userEmail}>
            <div className="user-avatar">{getInitials(userEmail)}</div>
            <div className="user-info">
              <span className="user-email-text">{userEmail || "User"}</span>
              <span className={`role-badge ${userRole === "ADMINISTRATOR" ? "admin" : ""}`}>
                {userRole}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            className="btn btn-outline"
            onClick={onLogout}
            style={{ padding: "8px 12px", fontSize: "13px" }}
            title="Sign Out"
          >
            <LogOutIcon size={15} />
            <span style={{ display: "inline-block" }}>Logout</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="btn-icon mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-medium)",
            padding: "14px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === "vault" ? "active" : ""}`}
            onClick={() => handleTabClick("vault")}
            style={{ width: "100%", justifyContent: "flex-start" }}
          >
            <KeyIcon size={16} />
            <span>My Vault ({credentialsCount})</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === "sharing" ? "active" : ""}`}
            onClick={() => handleTabClick("sharing")}
            style={{ width: "100%", justifyContent: "flex-start" }}
          >
            <UsersIcon size={16} />
            <span>Sharing & Teams ({sharedCount})</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => handleTabClick("security")}
            style={{ width: "100%", justifyContent: "flex-start" }}
          >
            <ActivityIcon size={16} />
            <span>Security Center & Analytics</span>
          </button>

          {userRole === "ADMINISTRATOR" && (
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => handleTabClick("admin")}
              style={{ width: "100%", justifyContent: "flex-start", color: "#f87171" }}
            >
              <span>⚡ Admin Console (RBAC)</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
