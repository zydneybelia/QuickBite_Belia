import { Navigate } from "react-router-dom";

const normalizeRole = (role) => {
  if (typeof role !== "string") return null;
  return role.startsWith("ROLE_") ? role.substring(5) : role;
};

const decodeJwtPayload = (token) => {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch (error) {
    console.error("Failed to decode JWT payload", error);
    return null;
  }
};

export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");

  // No token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    // Decode JWT payload
    const payload = decodeJwtPayload(token);

    const role = normalizeRole(payload?.role);
    const requiredRole = normalizeRole(allowedRole);

    // No role found
    if (!role) {
      localStorage.removeItem("token");
      return <Navigate to="/login" replace />;
    }

    // Wrong role
    if (allowedRole && role !== requiredRole) {
      switch (role) {
        case "CUSTOMER":
          return <Navigate to="/customer-dashboard" replace />;

        case "RESTAURANT_MANAGER":
          return <Navigate to="/manager-dashboard" replace />;

        case "ADMIN":
          return <Navigate to="/admin-dashboard" replace />;

        default:
          localStorage.removeItem("token");
          return <Navigate to="/login" replace />;
      }
    }

    return children;

  } catch (error) {
    console.error("Invalid token:", error);

    localStorage.removeItem("token");

    return <Navigate to="/login" replace />;
  }
}