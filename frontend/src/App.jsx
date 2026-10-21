import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Vault from "./pages/Vault";
import "./App.css";

function App() {
  const [page, setPage] = useState("dashboard"); // default to starting dashboard so users first view the project
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLoginSuccess = () => {
    setToken(localStorage.getItem("token"));
    setPage("vault");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setPage("dashboard");
  };

  return (
    <ThemeProvider>
      <div className="app">
        {page === "dashboard" && (
          <Dashboard
            isLoggedIn={Boolean(token)}
            onLogin={() => setPage("login")}
            onRegister={() => setPage("register")}
            onOpenVault={() => setPage("vault")}
            onLogout={handleLogout}
          />
        )}

        {page === "login" && (
          <Login
            onLogin={handleLoginSuccess}
            goToRegister={() => setPage("register")}
            goToDashboard={() => setPage("dashboard")}
          />
        )}

        {page === "register" && (
          <Register
            goToLogin={() => setPage("login")}
            goToDashboard={() => setPage("dashboard")}
          />
        )}

        {page === "vault" && (
          <Vault
            onLogout={handleLogout}
            goToDashboard={() => setPage("dashboard")}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;