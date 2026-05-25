import { useState, useEffect } from "react";
import axios from "axios";
import { loginUser, BASE_API_URL, OAUTH2_AUTH_URL } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const tokenFromGoogle = urlParams.get("token");

    if (tokenFromGoogle) {
      localStorage.setItem("token", tokenFromGoogle);
      window.history.replaceState({}, document.title, "/login");
      handleRoleRedirect(tokenFromGoogle);
    }
  }, []);

  const handleRoleRedirect = async (token) => {
    const decodeJwtRole = (jwt) => {
      try {
        const payload = jwt.split(".")[1];
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        const decoded = JSON.parse(atob(padded));
        return decoded?.role;
      } catch (error) {
        console.error("Failed to decode JWT role", error);
        return null;
      }
    };

    let role = decodeJwtRole(token);
    if (typeof role === "string" && role.startsWith("ROLE_")) {
      role = role.substring(5);
    }

    if (role === "CUSTOMER") {
      navigate("/customer-dashboard");
    } else if (role === "RESTAURANT_MANAGER") {
      try {
        const assignedRes = await axios.get(`${BASE_API_URL}/manager/assigned-restaurant`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const assigned = assignedRes.data;
        if (assigned?.restaurantId) {
          navigate(`/manager/restaurant/${assigned.restaurantId}`);
        } else {
          navigate("/manager/waiting");
        }
      } catch (error) {
        if (error.response?.status === 404) {
          navigate("/manager/waiting");
        } else {
          console.error("Failed to resolve manager restaurant assignment", error);
          navigate("/manager/waiting");
        }
      }
    } else if (role === "ADMIN") {
      navigate("/admin-dashboard");
    } else {
      navigate("/");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser({ email, password });

      // Store token
      const token = res.data.token;
      localStorage.setItem("token", token);

    const decodeJwtRole = (jwt) => {
      try {
        const payload = jwt.split(".")[1];
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        const decoded = JSON.parse(atob(padded));
        return decoded?.role;
      } catch (error) {
        console.error("Failed to decode JWT role", error);
        return null;
      }
    };

    let role = res.data.role || decodeJwtRole(token);
    if (typeof role === "string" && role.startsWith("ROLE_")) {
      role = role.substring(5);
    }

    // ✅ Redirect based on normalized role
    if (role === "CUSTOMER") {
      navigate("/customer-dashboard");
    } else if (role === "RESTAURANT_MANAGER") {
      try {
        const assignedRes = await axios.get(`${BASE_API_URL}/manager/assigned-restaurant`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const assigned = assignedRes.data;
        console.debug("Login: assigned-restaurant response:", assigned);
        if (assigned?.restaurantId) {
          console.debug("Login: navigating to manager restaurant dashboard for restaurant", assigned.restaurantId);
          navigate(`/manager/restaurant/${assigned.restaurantId}`);
        } else {
          console.debug("Login: no assigned restaurant, navigating to waiting page");
          navigate("/manager/waiting");
        }
      } catch (error) {
        console.debug("Login: error fetching assigned restaurant", error?.response?.status || error?.message || error);
        if (error.response?.status === 404) {
          navigate("/manager/waiting");
        } else {
          console.error("Failed to resolve manager restaurant assignment", error);
          navigate("/manager/waiting");
        }
      }
    } else if (role === "ADMIN") {
      navigate("/admin-dashboard");
    } else {
      navigate("/");
    }

  } catch (err) {
    const message = err.response?.data?.message || err.message || "Login failed";
    alert(message);
    console.error("Login error:", err);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.page}>
      {/* Background decoration */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.5 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3.5-7-7-7z" fill="white"/>
              <circle cx="12" cy="9" r="2.5" fill="#FF6B35"/>
            </svg>
          </div>
          <span style={styles.logoText}>QuickBite</span>
        </div>

        {/* Header */}
        <h1 style={styles.heading}>Log in</h1>
        <p style={styles.subtext}>
          Need an account?{" "}
          <a href="/register" style={styles.link}>Create an account</a>
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} style={styles.form}>
          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#FF6B35")}
              onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
            />
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <div style={styles.labelRow}>
              <label style={styles.label}>Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.showBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#FF6B35" strokeWidth="2" strokeLinecap="round">
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </>
                  )}
                </svg>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#FF6B35")}
              onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
            />
          </div>

          {/* Remember me */}
          <div style={styles.checkRow}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={styles.checkbox}
            />
            <label htmlFor="remember" style={styles.checkLabel}>
              Keep me logged in
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          {/* Google Login Button */}
          <button
            type="button"
            style={styles.googleBtn}
            onClick={() => {
              window.location.href = OAUTH2_AUTH_URL;
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>
      </div>

      {/* Bottom copyright */}
      <p style={styles.copyright}>© 2026 QuickBite. All rights reserved.</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f5f2",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    fontFamily: "'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  bgCircle1: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "rgba(255, 107, 53, 0.06)",
    top: "-100px",
    right: "-100px",
    pointerEvents: "none",
  },
  bgCircle2: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "rgba(255, 107, 53, 0.04)",
    bottom: "-80px",
    left: "-80px",
    pointerEvents: "none",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #ececec",
    padding: "2.5rem 2rem",
    width: "100%",
    maxWidth: "460px",
    position: "relative",
    zIndex: 1,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "1.5rem",
  },
  logoIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "#FF6B35",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1a1a1a",
    letterSpacing: "-0.3px",
  },
  heading: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0 0 0.25rem",
    letterSpacing: "-0.5px",
  },
  subtext: {
    fontSize: "14px",
    color: "#888",
    margin: "0 0 1.75rem",
  },
  link: {
    color: "#FF6B35",
    textDecoration: "none",
    fontWeight: "500",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#555",
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  showBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "none",
    border: "none",
    color: "#FF6B35",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    padding: "0",
  },
  input: {
    height: "44px",
    padding: "0 14px",
    borderRadius: "10px",
    border: "1.5px solid #e0e0e0",
    fontSize: "14px",
    color: "#1a1a1a",
    background: "#fafafa",
    outline: "none",
    transition: "border-color 0.2s",
    width: "100%",
    boxSizing: "border-box",
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "4px",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "#FF6B35",
    cursor: "pointer",
  },
  checkLabel: {
    fontSize: "14px",
    color: "#555",
    cursor: "pointer",
  },
  submitBtn: {
    marginTop: "8px",
    height: "48px",
    background: "#FF6B35",
    color: "white",
    border: "none",
    borderRadius: "999px",
    fontSize: "15px",
    fontWeight: "600",
    letterSpacing: "0.2px",
    transition: "background 0.2s, transform 0.1s",
  },
  googleBtn: {
    marginTop: "12px",
    height: "48px",
    background: "#ffffff",
    color: "#1a1a1a",
    border: "1.5px solid #e0e0e0",
    borderRadius: "999px",
    fontSize: "15px",
    fontWeight: "600",
    letterSpacing: "0.2px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    transition: "background 0.2s, border-color 0.2s",
  },
  footerLinks: {
    display: "flex",
    justifyContent: "center",
    gap: "2rem",
    marginTop: "1.25rem",
    fontSize: "13px",
  },
  centeredLink: {
    textAlign: "center",
    marginTop: "0.75rem",
    fontSize: "13px",
  },
  copyright: {
    fontSize: "12px",
    color: "#aaa",
    marginTop: "1.5rem",
    zIndex: 1,
  },
};