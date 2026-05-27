import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import CustomerDashboard from "./components/CustomerDashboard";
import RestaurantList from "./components/RestaurantList";
import RestaurantMenu from "./components/RestaurantMenu";
import ManagerDashboard from "./components/ManagerDashboard";
import ManagerRedirect from "./components/ManagerRedirect";
import ManagerWaiting from "./components/ManagerWaiting";
import AdminDashboard from "./components/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute allowedRole="CUSTOMER">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/restaurants"
          element={
            <ProtectedRoute allowedRole="CUSTOMER">
              <RestaurantList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/restaurants/:restaurantId"
          element={
            <ProtectedRoute allowedRole="CUSTOMER">
              <RestaurantMenu />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager-dashboard"
          element={
            <ProtectedRoute allowedRole="RESTAURANT_MANAGER">
              <ManagerRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/restaurant/:restaurantId"
          element={
            <ProtectedRoute allowedRole="RESTAURANT_MANAGER">
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/waiting"
          element={
            <ProtectedRoute allowedRole="RESTAURANT_MANAGER">
              <ManagerWaiting />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;