import { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (form.password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      alert("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser(form);
      alert(res.data.message || "Registered successfully");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = (e) => (e.target.style.borderColor = "#FF6B35");
  const blurStyle = (e) => (e.target.style.borderColor = "#e0e0e0");

  return (
    <div style={styles.page}>
      {/* Background decorations */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.5 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3.5-7-7-7z" fill="white" />
              <circle cx="12" cy="9" r="2.5" fill="#FF6B35" />
            </svg>
          </div>
          <span style={styles.logoText}>QuickBite</span>
        </div>

        {/* Header */}
        <h1 style={styles.heading}>Create account</h1>
        <p style={styles.subtext}>
          Already have an account?{" "}
          <a href="/login" style={styles.link}>Log in</a>
        </p>

        {/* Form */}
        <form onSubmit={handleRegister} style={styles.form}>

          {/* First & Last Name Row */}
          <div style={styles.nameRow}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>First name</label>
              <input
                name="firstname"
                placeholder="John"
                value={form.firstname}
                onChange={handleChange}
                onFocus={focusStyle}
                onBlur={blurStyle}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Last name</label>
              <input
                name="lastname"
                placeholder="Doe"
                value={form.lastname}
                onChange={handleChange}
                onFocus={focusStyle}
                onBlur={blurStyle}
                required
                style={styles.input}
              />
            </div>
          </div>

          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              onFocus={focusStyle}
              onBlur={blurStyle}
              required
              style={styles.input}
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
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              onFocus={focusStyle}
              onBlur={blurStyle}
              required
              minLength={8}
              style={styles.input}
            />
          </div>

          {/* Confirm Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Confirm password</label>
            <input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
              required
              minLength={8}
              style={styles.input}
            />
          </div>

          {/* Password strength hint */}
          {form.password.length > 0 && (
            <div style={styles.strengthRow}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    ...styles.strengthBar,
                    background:
                      form.password.length >= i * 3
                        ? form.password.length >= 10
                          ? "#22c55e"
                          : "#FF6B35"
                        : "#e0e0e0",
                  }}
                />
              ))}
              <span style={styles.strengthLabel}>
                {form.password.length < 4
                  ? "Too short"
                  : form.password.length < 7
                  ? "Weak"
                  : form.password.length < 10
                  ? "Good"
                  : "Strong"}
              </span>
            </div>
          )}

          {/* ✅ Fixed Terms Checkbox — wrapped in <span> for natural inline flow */}
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              style={styles.checkbox}
              required
            />
            <span>
              By creating an account, you agree to QuickBite's{" "}
              <a href="/terms" style={styles.link}>Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" style={styles.link}>Privacy Policy</a>.
            </span>
          </label>

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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* Footer */}
        <div style={styles.centeredLink}>
          <a href="/login" style={styles.link}>Already have an account? Log in</a>
        </div>
      </div>

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
  nameRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
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
  strengthRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "-4px",
  },
  strengthBar: {
    height: "4px",
    flex: 1,
    borderRadius: "2px",
    transition: "background 0.3s",
  },
  strengthLabel: {
    fontSize: "12px",
    color: "#888",
    minWidth: "50px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    fontSize: "12px",
    color: "#555",
    lineHeight: "1.6",
    cursor: "pointer",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    marginTop: "3px",
    accentColor: "#FF6B35",
    flexShrink: 0,
    cursor: "pointer",
  },
  terms: {
    fontSize: "12px",
    color: "#aaa",
    margin: "0",
    lineHeight: "1.6",
  },
  submitBtn: {
    marginTop: "4px",
    height: "48px",
    background: "#FF6B35",
    color: "white",
    border: "none",
    borderRadius: "999px",
    fontSize: "15px",
    fontWeight: "600",
    letterSpacing: "0.2px",
    transition: "background 0.2s",
  },
  centeredLink: {
    textAlign: "center",
    marginTop: "1.25rem",
    fontSize: "13px",
  },
  copyright: {
    fontSize: "12px",
    color: "#aaa",
    marginTop: "1.5rem",
    zIndex: 1,
  },
};