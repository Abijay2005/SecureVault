import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  ShieldIcon,
  ShieldCheckIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  AlertIcon,
  CheckIcon,
  KeyIcon,
  SunIcon,
  MoonIcon,
} from "../components/Icons";

const API_URL = "http://localhost:8080";

function Login({ onLogin, goToRegister, goToDashboard }) {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaHint, setMfaHint] = useState("");

  // Forgot Password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = request, 2 = reset

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login?email=${encodeURIComponent(
          email
        )}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json().catch(async () => {
        const text = await response.text();
        return { message: text };
      });

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password");
      }

      if (data.mfaRequired) {
        setMfaRequired(true);
        setChallengeToken(data.challengeToken);
        setMfaHint(data.hint || "");
        return;
      }

      const token = data.token;
      if (!token) {
        throw new Error("JWT token not received from server");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("userEmail", data.email || email);
      localStorage.setItem("userRole", data.role || "USER");
      localStorage.setItem("userName", data.name || "");
      if (data.mfaEnabled !== undefined) {
        localStorage.setItem("userMfaEnabled", String(data.mfaEnabled));
      }

      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/mfa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken,
          code: mfaCode,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "MFA verification failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.email || email);
      localStorage.setItem("userRole", data.role || "USER");
      localStorage.setItem("userName", data.name || "");
      if (data.mfaEnabled !== undefined) {
        localStorage.setItem("userMfaEnabled", String(data.mfaEnabled));
      }

      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password?email=${encodeURIComponent(forgotEmail)}`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Password recovery failed");
      }
      setResetToken(data.resetToken);
      setSuccessMsg("Recovery token generated! Enter your new password below.");
      setResetStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Password reset failed");
      }
      setSuccessMsg("Password reset successfully! You can now log in.");
      setShowForgot(false);
      setResetStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Top right theme toggle */}
      <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 20 }}>
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </div>

      <div className="auth-card">
        {goToDashboard && (
          <button
            type="button"
            onClick={goToDashboard}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "14px",
              padding: 0,
            }}
          >
            ← Back to Overview
          </button>
        )}

        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-brand-badge">
            <ShieldIcon size={26} />
          </div>
          <h1 className="auth-title">SecureVault</h1>
          <p className="auth-subtitle">Secure Credential & Password Vault</p>
        </div>

        {/* Banner Messages */}
        {error && (
          <div className="feedback-banner error" role="alert">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertIcon size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="feedback-banner success" role="alert">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckIcon size={16} />
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {/* 1. MFA Flow */}
        {mfaRequired ? (
          <form onSubmit={handleVerifyMfa} className="auth-form">
            <div style={{ textAlign: "center", marginBottom: "14px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                }}
              >
                <ShieldCheckIcon size={26} />
              </div>
              <h2 style={{ fontSize: "19px", fontWeight: "700", color: "var(--text-primary)" }}>
                Two-Factor Authentication
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Enter the verification code from your authenticator app or email.
              </p>
            </div>

            {mfaHint && mfaHint.includes("dev mode") ? (
              <div
                style={{
                  background: "var(--warning-bg)",
                  border: "1px solid var(--warning-border)",
                  color: "var(--warning-text)",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertIcon size={16} />
                <span>{mfaHint}</span>
              </div>
            ) : (
              <div
                style={{
                  background: "var(--bg-surface-raised, rgba(255, 255, 255, 0.04))",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "12px",
                  lineHeight: "1.4",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <MailIcon size={16} style={{ flexShrink: 0, color: "var(--primary-color)" }} />
                <span>A single-use code has also been dispatched to your email. You can enter that code, your Authenticator code, or a backup recovery code.</span>
              </div>
            )}

            <div className="form-group" style={{ marginTop: "6px" }}>
              <label className="form-label">Verification / Recovery Code</label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <KeyIcon size={16} />
                </span>
                <input
                  type="text"
                  className="input-field input-with-icon-left mono-text"
                  placeholder="000000 or XXXX-XXXX"
                  maxLength="10"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.toUpperCase())}
                  style={{ textAlign: "center", letterSpacing: "0.18em", fontSize: "16px", fontWeight: "600" }}
                  required
                  autoFocus
                />
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", textAlign: "center" }}>
                Supports Google Authenticator, Microsoft Authenticator, Email OTP & Backup Codes.
              </p>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "4px" }} disabled={loading}>
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>

            <button
              type="button"
              className="link-button"
              style={{ alignSelf: "center", marginTop: "10px" }}
              onClick={() => {
                setMfaRequired(false);
                setMfaCode("");
                setError("");
              }}
            >
              ← Back to Sign In
            </button>
          </form>
        ) : showForgot ? (
          /* 2. Password Recovery Flow */
          <div>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: "700", color: "var(--text-primary)" }}>
                Reset Password
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                {resetStep === 1
                  ? "Enter your email to receive a recovery token."
                  : "Enter your recovery token and choose a new password."}
              </p>
            </div>

            {resetStep === 1 ? (
              <form onSubmit={handleForgotPassword} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Registered Account Email</label>
                  <div className="input-wrapper">
                    <span className="input-icon-left">
                      <MailIcon size={16} />
                    </span>
                    <input
                      type="email"
                      className="input-field input-with-icon-left"
                      placeholder="name@company.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                  {loading ? "Submitting..." : "Generate Recovery Token"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Recovery Token</label>
                  <input
                    type="text"
                    className="input-field mono-text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon-left">
                      <LockIcon size={16} />
                    </span>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="input-field input-with-icon-left"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <div className="input-action-right">
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label="Toggle password view"
                      >
                        {showNewPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                  {loading ? "Updating Password..." : "Set New Password"}
                </button>
              </form>
            )}

            <div className="auth-footer">
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setShowForgot(false);
                  setResetStep(1);
                  setError("");
                }}
              >
                ← Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* 3. Standard Login Flow */
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <MailIcon size={16} />
                </span>
                <input
                  type="email"
                  className="input-field input-with-icon-left"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label">
                <span>Password</span>
                <button
                  type="button"
                  className="link-button"
                  style={{ fontSize: "12px", fontWeight: "500" }}
                  onClick={() => {
                    setShowForgot(true);
                    setError("");
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <div className="input-wrapper">
                <span className="input-icon-left">
                  <LockIcon size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field input-with-icon-left"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="input-action-right">
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "6px" }}
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Sign In to Vault"}
            </button>
          </form>
        )}

        {/* Footer Link to Register */}
        {!mfaRequired && !showForgot && (
          <div className="auth-footer">
            <span>Don't have a SecureVault account? </span>
            <button
              type="button"
              className="link-button"
              onClick={goToRegister}
            >
              Create Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;