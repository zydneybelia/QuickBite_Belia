import { useNavigate } from "react-router-dom";

export default function ManagerWaiting() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Waiting for Admin Assignment</h2>
        <p style={styles.description}>
          Your account is active, but an admin has not assigned you to a restaurant yet.
          Once the assignment is complete, you will be able to access your manager dashboard.
        </p>
        <button onClick={() => navigate("/login")} style={styles.button}>
          Return to login
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    background: "#f7f5f2",
  },
  card: {
    maxWidth: "520px",
    width: "100%",
    padding: "32px",
    borderRadius: "24px",
    background: "white",
    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
    textAlign: "center",
  },
  title: {
    fontSize: "28px",
    marginBottom: "14px",
    color: "#111827",
  },
  description: {
    fontSize: "16px",
    color: "#4b5563",
    lineHeight: 1.75,
    marginBottom: "28px",
  },
  button: {
    background: "#FF6B35",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "14px 20px",
    fontSize: "15px",
    cursor: "pointer",
  },
};
