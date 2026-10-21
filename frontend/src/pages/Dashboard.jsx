import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  ShieldIcon,
  ShieldCheckIcon,
  KeyIcon,
  LockIcon,
  UnlockIcon,
  EyeIcon,
  EyeOffIcon,
  CopyIcon,
  CheckIcon,
  StarIcon,
  SunIcon,
  MoonIcon,
  SparklesIcon,
  UsersIcon,
  UserIcon,
  ActivityIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "../components/Icons";

export default function Dashboard({
  onLogin,
  onRegister,
  onOpenVault,
  onLogout,
  isLoggedIn,
}) {
  const { theme, toggleTheme } = useTheme();

  const [copiedKey, setCopiedKey] = useState("");

  // Interactive Vault Preview Mock State
  const [revealedItems, setRevealedItems] = useState({});

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const toggleItemReveal = (id) => {
    setRevealedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)" }}>
      {/* -------------------------------------------------------------
          TOP BAR / NAVIGATION
         ------------------------------------------------------------- */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "var(--navbar-bg)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "16px 28px",
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          {/* Main SecureVault Brand Logo */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "var(--radius-md)",
                background: "var(--accent-glow)",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-cyan)",
                boxShadow: "0 0 16px var(--accent-glow)",
              }}
            >
              <ShieldCheckIcon size={24} />
            </div>
            <div>
              <div style={{ fontSize: "21px", fontWeight: "800", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                Secure<span style={{ color: "var(--accent-cyan)" }}>Vault</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>
                Smart & Safe Password Manager
              </div>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--text-secondary)",
            }}
            className="landing-desktop-nav"
          >
            <a href="#features" style={{ color: "inherit", textDecoration: "none" }}>
              Features
            </a>
            <a href="#preview" style={{ color: "inherit", textDecoration: "none" }}>
              Vault Preview
            </a>
            <a href="#how-it-works" style={{ color: "inherit", textDecoration: "none" }}>
              How It Works
            </a>
          </nav>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Theme Toggle */}
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onOpenVault}
                  style={{ gap: "8px", padding: "9px 20px" }}
                >
                  <KeyIcon size={16} />
                  <span>Open My Vault</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onLogout}
                  style={{ padding: "9px 14px", fontSize: "13px" }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onLogin}
                  style={{ padding: "9px 18px", fontSize: "13.5px" }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onRegister}
                  style={{ padding: "9px 20px", fontSize: "13.5px", boxShadow: "0 2px 12px var(--accent-glow)" }}
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          MAIN HERO SECTION: SECUREVAULT IN FOCUS
         ------------------------------------------------------------- */}
      <section
        style={{
          padding: "70px 24px 60px",
          textAlign: "center",
          background: "radial-gradient(ellipse at 50% 15%, var(--accent-glow) 0%, transparent 65%)",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Friendly pill badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              background: "var(--bg-surface-raised)",
              border: "1px solid var(--border-medium)",
              fontSize: "13px",
              fontWeight: "600",
              color: "var(--accent-cyan)",
              marginBottom: "20px",
            }}
          >
            <span>🛡️ Simple, Safe & Private</span>
            <span>•</span>
            <span>Zero-Knowledge Protection</span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: "clamp(34px, 5.2vw, 58px)",
              fontWeight: "900",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              marginBottom: "18px",
              color: "var(--text-primary)",
            }}
          >
            All Your Passwords in One{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent-cyan) 0%, #38bdf8 60%, #818cf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Secure Vault
            </span>
          </h1>

          {/* Simple, Non-Technical Description */}
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 19px)",
              color: "var(--text-secondary)",
              maxWidth: "700px",
              margin: "0 auto 36px",
              lineHeight: 1.6,
            }}
          >
            Never forget or lose a password again. SecureVault locks your logins, credit cards,
            and confidential notes with bank-level encryption and lets you safely share access with your team or family.
          </p>

          {/* Call to action buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              flexWrap: "wrap",
              marginBottom: "50px",
            }}
          >
            {isLoggedIn ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onOpenVault}
                style={{
                  fontSize: "16px",
                  padding: "14px 34px",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "0 4px 20px var(--accent-glow)",
                  gap: "8px",
                }}
              >
                <KeyIcon size={18} />
                <span>Go to My SecureVault</span>
                <ArrowRightIcon size={18} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onRegister}
                  style={{
                    fontSize: "16px",
                    padding: "14px 34px",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "0 4px 20px var(--accent-glow)",
                    gap: "8px",
                  }}
                >
                  <span>Start Using SecureVault — Free</span>
                  <ArrowRightIcon size={18} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onLogin}
                  style={{
                    fontSize: "16px",
                    padding: "14px 26px",
                    borderRadius: "var(--radius-lg)",
                  }}
                >
                  <span>I already have an account</span>
                </button>
              </>
            )}
          </div>

          {/* Quick Trust Highlights */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "28px",
              flexWrap: "wrap",
              fontSize: "13px",
              color: "var(--text-muted)",
              fontWeight: "600",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircleIcon size={16} className="text-accent" />
              <span>Free to use</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircleIcon size={16} className="text-accent" />
              <span>Only you see your passwords</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircleIcon size={16} className="text-accent" />
              <span>Easy team sharing</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircleIcon size={16} className="text-accent" />
              <span>Extra 2-Step verification</span>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SECTION 2: LIVE INTERACTIVE VAULT PREVIEW
         ------------------------------------------------------------- */}
      <section id="preview" style={{ padding: "40px 24px 70px" }}>
        <div style={{ maxWidth: "980px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" }}>
              Clean, Simple & Easy to Use
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "6px" }}>
              Here is how your passwords look inside SecureVault. Click to reveal or copy any item:
            </p>
          </div>

          {/* Interactive Vault Showcase Card */}
          <div
            style={{
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border-medium)",
              boxShadow: "var(--card-shadow-hover)",
              overflow: "hidden",
            }}
          >
            {/* Top Bar of the Vault window */}
            <div
              style={{
                background: "var(--bg-surface-raised)",
                padding: "14px 20px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                  <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                  <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", marginLeft: "6px" }}>
                  My SecureVault — 3 Items Protected
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--success-text)", fontWeight: "600" }}>
                🟢 Vault Unlocked & Safe
              </span>
            </div>

            {/* List of Mock Vault Items */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Item 1: Google Account */}
              <div
                style={{
                  background: "var(--bg-surface-raised)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "rgba(66, 133, 244, 0.15)",
                      color: "#4285F4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "19px",
                      fontWeight: "700",
                    }}
                  >
                    G
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: "700", fontSize: "15px" }}>Google / Gmail</span>
                      <span style={{ fontSize: "10.5px", fontWeight: "700", background: "rgba(16, 185, 129, 0.15)", color: "var(--success-text)", padding: "2px 7px", borderRadius: "4px" }}>
                        STRONG
                      </span>
                    </div>
                    <div className="mono-text" style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                      alice.dev@gmail.com
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    className="mono-text"
                    style={{
                      fontSize: "13.5px",
                      padding: "6px 14px",
                      background: "var(--bg-input)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-subtle)",
                      minWidth: "140px",
                      textAlign: "center",
                    }}
                  >
                    {revealedItems["google"] ? "p@ssW0rd_G00gle#26" : "••••••••••••••"}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12.5px" }}
                    onClick={() => toggleItemReveal("google")}
                  >
                    {revealedItems["google"] ? "Hide" : "Reveal"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12.5px" }}
                    onClick={() => handleCopy("p@ssW0rd_G00gle#26", "google")}
                  >
                    {copiedKey === "google" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Item 2: Netflix Subscription */}
              <div
                style={{
                  background: "var(--bg-surface-raised)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "rgba(239, 68, 68, 0.15)",
                      color: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "19px",
                      fontWeight: "700",
                    }}
                  >
                    N
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: "700", fontSize: "15px" }}>Netflix Family Account</span>
                      <span style={{ fontSize: "10.5px", fontWeight: "700", background: "var(--accent-glow)", color: "var(--accent-cyan)", padding: "2px 7px", borderRadius: "4px" }}>
                        SHARED WITH FAMILY
                      </span>
                    </div>
                    <div className="mono-text" style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                      home-tv@netflix.com
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    className="mono-text"
                    style={{
                      fontSize: "13.5px",
                      padding: "6px 14px",
                      background: "var(--bg-input)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-subtle)",
                      minWidth: "140px",
                      textAlign: "center",
                    }}
                  >
                    {revealedItems["netflix"] ? "NetFlix!4K#Home2026" : "••••••••••••••"}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12.5px" }}
                    onClick={() => toggleItemReveal("netflix")}
                  >
                    {revealedItems["netflix"] ? "Hide" : "Reveal"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12.5px" }}
                    onClick={() => handleCopy("NetFlix!4K#Home2026", "netflix")}
                  >
                    {copiedKey === "netflix" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Item 3: Work Slack */}
              <div
                style={{
                  background: "var(--bg-surface-raised)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "rgba(168, 85, 247, 0.15)",
                      color: "#c084fc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "19px",
                      fontWeight: "700",
                    }}
                  >
                    S
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: "700", fontSize: "15px" }}>Slack Engineering Workspace</span>
                      <span style={{ fontSize: "10.5px", fontWeight: "700", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", padding: "2px 7px", borderRadius: "4px" }}>
                        WORK TEAM
                      </span>
                    </div>
                    <div className="mono-text" style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                      alice@company.com
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    className="mono-text"
                    style={{
                      fontSize: "13.5px",
                      padding: "6px 14px",
                      background: "var(--bg-input)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-subtle)",
                      minWidth: "140px",
                      textAlign: "center",
                    }}
                  >
                    {revealedItems["slack"] ? "Sl@ck_Core928#Key" : "••••••••••••••"}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12.5px" }}
                    onClick={() => toggleItemReveal("slack")}
                  >
                    {revealedItems["slack"] ? "Hide" : "Reveal"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12.5px" }}
                    onClick={() => handleCopy("Sl@ck_Core928#Key", "slack")}
                  >
                    {copiedKey === "slack" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SECTION 3: WHAT MAKES SECUREVAULT GREAT (SIMPLE FEATURES)
         ------------------------------------------------------------- */}
      <section id="features" style={{ padding: "50px 24px 70px", maxWidth: "1140px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <h2 style={{ fontSize: "30px", fontWeight: "800", letterSpacing: "-0.02em" }}>
            Everything You Need to Stay Protected
          </h2>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "6px" }}>
            SecureVault was built from the ground up to be simple to use while keeping your secrets completely locked down.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {/* Card 1: Safe & Locked */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "26px",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "var(--radius-md)",
                background: "var(--accent-glow)",
                color: "var(--accent-cyan)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <LockIcon size={22} />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "6px" }}>
              Bank-Grade Safe Storage
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
              Your passwords are encrypted with military-grade AES-256 locks before they ever leave your device.
              Not even the SecureVault team can see what you store.
            </p>
          </div>

          {/* Card 2: Team & Family Sharing */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "26px",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "var(--radius-md)",
                background: "rgba(16, 185, 129, 0.12)",
                color: "var(--success-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <UsersIcon size={22} />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "6px" }}>
              Easy Team & Friend Sharing
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
              Share passwords with one colleague or your whole team in a click.
              You decide if they can only view or also edit, and you can revoke access at any time.
            </p>
          </div>

          {/* Card 3: 2-Step Verification */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "26px",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "var(--radius-md)",
                background: "rgba(129, 140, 248, 0.15)",
                color: "#818cf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <ShieldCheckIcon size={22} />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "6px" }}>
              Extra 2-Step Protection (MFA)
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
              Use your smartphone with Google Authenticator or quick email verification codes.
              Even if someone guesses your master password, they still cannot get into your vault.
            </p>
          </div>

          {/* Card 4: Generator */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "26px",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "var(--radius-md)",
                background: "rgba(168, 85, 247, 0.15)",
                color: "#c084fc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <SparklesIcon size={22} />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "6px" }}>
              Instant Strong Password Generator
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
              Stop reusing simple passwords. Create long, complex passwords that no hacker can guess,
              and let SecureVault remember them for you.
            </p>
          </div>

          {/* Card 5: Security Health */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "26px",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "var(--radius-md)",
                background: "rgba(245, 158, 11, 0.15)",
                color: "var(--warning-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <ActivityIcon size={22} />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "6px" }}>
              Security Center & Health Check
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
              Get an instant health score for all your passwords. See which passwords are weak or old
              so you can update them before any breach happens.
            </p>
          </div>

          {/* Card 6: Notes & Cards */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "26px",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "var(--radius-md)",
                background: "rgba(56, 189, 248, 0.15)",
                color: "var(--accent-cyan)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <KeyIcon size={22} />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "6px" }}>
              More Than Just Passwords
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
              Store confidential Wi-Fi keys, server API tokens, recovery keys, and private encrypted notes
              alongside your logins.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          HOW SECUREVAULT WORKS (3 EASY STEPS)
         ------------------------------------------------------------- */}
      <section id="how-it-works" style={{ padding: "70px 24px", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" }}>
            How SecureVault Works
          </h2>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "6px" }}>
            Getting started takes less than two minutes.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
          <div style={{ background: "var(--bg-surface)", padding: "26px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--accent-glow)", color: "var(--accent-cyan)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontWeight: "800", fontSize: "17px" }}>
              1
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>Create Your Account</h3>
            <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Set up your master password. Only you have the key to unlock your personal vault.
            </p>
          </div>

          <div style={{ background: "var(--bg-surface)", padding: "26px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.15)", color: "var(--success-text)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontWeight: "800", fontSize: "17px" }}>
              2
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>Save & Organize Logins</h3>
            <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Add your website accounts, work tools, and cards. Copy or reveal them in one click.
            </p>
          </div>

          <div style={{ background: "var(--bg-surface)", padding: "26px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontWeight: "800", fontSize: "17px" }}>
              3
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>Share Safely with Teams</h3>
            <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Need someone on your team to access a tool? Share access securely with custom expiry times.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          FINAL CALL TO ACTION BANNER
         ------------------------------------------------------------- */}
      <section
        style={{
          padding: "70px 24px",
          background: "radial-gradient(ellipse at 50% 100%, var(--accent-glow) 0%, transparent 65%)",
          borderTop: "1px solid var(--border-subtle)",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "var(--radius-lg)",
              background: "var(--accent-glow)",
              color: "var(--accent-cyan)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 0 20px var(--accent-glow)",
            }}
          >
            <ShieldCheckIcon size={32} />
          </div>

          <h2 style={{ fontSize: "32px", fontWeight: "900", letterSpacing: "-0.02em" }}>
            Get Started with SecureVault Today
          </h2>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "10px", lineHeight: 1.6 }}>
            Free, simple, and private. Keep your digital life safe and easily managed in one place.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "14px", marginTop: "28px", flexWrap: "wrap" }}>
            {isLoggedIn ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onOpenVault}
                style={{ fontSize: "15px", padding: "13px 30px", borderRadius: "var(--radius-md)" }}
              >
                <KeyIcon size={18} />
                <span>Open My SecureVault</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onRegister}
                  style={{ fontSize: "15px", padding: "13px 30px", borderRadius: "var(--radius-md)" }}
                >
                  <span>Create Free Account</span>
                  <ArrowRightIcon size={18} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onLogin}
                  style={{ fontSize: "15px", padding: "13px 26px", borderRadius: "var(--radius-md)" }}
                >
                  <span>Sign In</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "28px 24px",
          background: "var(--bg-base)",
          fontSize: "13px",
          color: "var(--text-muted)",
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheckIcon size={18} />
            <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>SecureVault</span>
            <span>— Simple & Safe Password Management</span>
          </div>

          <div>
            <span>© {new Date().getFullYear()} SecureVault. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
