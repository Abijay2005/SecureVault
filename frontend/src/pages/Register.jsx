import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  ShieldIcon,
  UserIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  AlertIcon,
  CheckIcon,
  SunIcon,
  MoonIcon,
} from "../components/Icons";

const API_URL = "http://localhost:8080";

function Register({ goToLogin, goToDashboard }) {
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setMessage("Registration successful! You can now sign in with your credentials.");
      setName("");
      setEmail("");
      setPassword("");
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Initialize your encrypted Zero-Knowledge Vault</p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="feedback-banner error" role="alert">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertIcon size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {message && (
          <div className="feedback-banner success" role="alert">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckIcon size={16} />
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <UserIcon size={16} />
              </span>
              <input
                type="text"
                className="input-field input-with-icon-left"
                placeholder="Alex Mercer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <MailIcon size={16} />
              </span>
              <input
                type="email"
                className="input-field input-with-icon-left"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <LockIcon size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="input-field input-with-icon-left"
                placeholder="Create a strong password"
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
            style={{ width: "100%", marginTop: "10px" }}
            disabled={loading}
          >
            {loading ? "Creating Encrypted Vault..." : "Register Secure Account"}
          </button>
        </form>

        {/* Footer Navigation to Login */}
        <div className="auth-footer">
          <span>Already have an account? </span>
          <button
            type="button"
            className="link-button"
            onClick={goToLogin}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;