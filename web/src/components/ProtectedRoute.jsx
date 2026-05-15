import { Navigate } from "react-router-dom";

const normalizeRole = (role) => {
  if (typeof role !== "string") return null;
  return role.startsWith("ROLE_") ? role.substring(5) : role;
};

export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");

  // No token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    // Decode JWT payload
    const payload = JSON.parse(atob(token.split(".")[1]));

    const role = normalizeRole(payload.role);
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