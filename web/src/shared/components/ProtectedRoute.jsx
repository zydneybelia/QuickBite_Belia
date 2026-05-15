import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");

  // No token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    // Decode JWT payload
    const payload = JSON.parse(atob(token.split(".")[1]));

    // Adjust this depending on your JWT structure
    const role = payload.role;

    // No role found
    if (!role) {
      localStorage.removeItem("token");
      return <Navigate to="/login" replace />;
    }

    // Wrong role
    if (allowedRole && role !== allowedRole) {

      switch (role) {
        case "CUSTOMER":
          return <Navigate to="/customer-dashboard" replace />;

        case "RESTAURANT_MANAGER|| ":
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
