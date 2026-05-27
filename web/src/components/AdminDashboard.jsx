import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8086/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [managers, setManagers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch {}
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersRes, restaurantsRes, ordersRes, managersRes] = await Promise.all([
        axios.get(`${API_URL}/users`, authHeaders),
        axios.get(`${API_URL}/admin/restaurants`, authHeaders),
        axios.get(`${API_URL}/orders`, authHeaders),
        axios.get(`${API_URL}/admin/managers`, authHeaders),
      ]);

      setUsers(usersRes.data);
      setRestaurants(restaurantsRes.data);
      setOrders(ordersRes.data);
      setManagers(managersRes.data);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return "—";
    
    // Handle array format [YYYY, MM, DD, HH, mm, ss]
    if (Array.isArray(dateInput)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
      // Month in JS Date is 0-indexed
      return new Date(year, month - 1, day, hour, minute, second).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    }
    
    // Handle string or timestamp
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "—";
    
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const statusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "PLACED":    return { bg: "#fff7ed", color: "#ea580c" };
      case "PREPARING": return { bg: "#fef9c3", color: "#ca8a04" };
      case "OUT_FOR_DELIVERY": return { bg: "#eff6ff", color: "#2563eb" };
      case "DELIVERED": return { bg: "#f0fdf4", color: "#16a34a" };
      case "CANCELLED": return { bg: "#fef2f2", color: "#dc2626" };
      default:          return { bg: "#f3f4f6", color: "#6b7280" };
    }
  };

  const usersList = Array.isArray(users) ? users : [];
  const nonAdminUsers = usersList.filter((u) => u.role !== "ADMIN" && u.role !== "MANAGER");
  const restaurantsList = Array.isArray(restaurants) ? restaurants : [];
  const managersList = Array.isArray(managers) ? managers : [];
  const ordersList = Array.isArray(orders) ? orders : [];

  const totalRevenue = ordersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const userStats = {
    total: nonAdminUsers.length,
    customers: nonAdminUsers.filter((u) => u.role === "CUSTOMER").length,
    managers: managersList.length,
    active: nonAdminUsers.filter((u) => u.active).length,
    disabled: nonAdminUsers.filter((u) => !u.active).length,
  };

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showOnboardRestaurant, setShowOnboardRestaurant] = useState(false);
  const [showCreateRestaurant, setShowCreateRestaurant] = useState(false);
  const [showEditRestaurant, setShowEditRestaurant] = useState(false);
  const [showCreateManager, setShowCreateManager] = useState(false);
  const [showUpdateManager, setShowUpdateManager] = useState(false);
  const [showViewManager, setShowViewManager] = useState(false);
  const [isEditingManager, setIsEditingManager] = useState(false);
  const [editManagerForm, setEditManagerForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    contactNumber: "",
  });
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewUser, setShowViewUser] = useState(false);
  const [showAdminProfile, setShowAdminProfile] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [adminProfileForm, setAdminProfileForm] = useState({ firstname: "", lastname: "", email: "", contactNumber: "" });
  const [adminProfileLoading, setAdminProfileLoading] = useState(false);
  const [adminProfileSaving, setAdminProfileSaving] = useState(false);
  const [isEditingAdminProfile, setIsEditingAdminProfile] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [restaurantMenu, setRestaurantMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [addingMenuItem, setAddingMenuItem] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "Main",
    availability: true
  });
  const [selectedViewRestaurant, setSelectedViewRestaurant] = useState(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [selectedExistingManagerId, setSelectedExistingManagerId] = useState("");
  const [onboardForm, setOnboardForm] = useState({
    name: "",
    description: "",
    location: "",
    contactNumber: "",
    cuisineType: "",
    status: "active",
  });

  const selectedUserOrders = selectedUser ? ordersList.filter((o) => {
    const userEmail = selectedUser.email?.toLowerCase();
    const userFullName = `${selectedUser.firstname || ""} ${selectedUser.lastname || ""}`.trim().toLowerCase();
    const orderEmail = o.user?.email?.toLowerCase?.();
    const orderCustomerName = (o.customerName || "").toLowerCase();
    return (
      o.user?.id === selectedUser.id ||
      orderEmail === userEmail ||
      orderCustomerName === userEmail ||
      orderCustomerName === userFullName
    );
  }) : [];
  const getCurrentUserId = () => {
    if (!user) return null;
    return user.userId || user.id || user.sub || null;
  };

  const getUserIdFromToken = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload?.userId || payload?.sub || payload?.id || null;
    } catch {
      return null;
    }
  };

  const fetchAdminProfile = async () => {
    const userId = getCurrentUserId() || getUserIdFromToken();
    if (!userId) return;
    setAdminProfileLoading(true);
    try {
      const res = await axios.get(`${API_URL}/users/${userId}`, authHeaders);
      const userProfile = res.data;
      setAdminProfile(userProfile);
      setAdminProfileForm({
        firstname: userProfile.firstname || "",
        lastname: userProfile.lastname || "",
        email: userProfile.email || "",
        contactNumber: userProfile.contactNumber || "",
      });
      setUser((prev) => ({
        ...prev,
        sub: userProfile.firstname ? `${userProfile.firstname} ${userProfile.lastname || ""}`.trim() : (userProfile.email || prev?.sub),
      }));
      return userProfile;
    } catch (err) {
      console.error("Failed to load admin profile", err);
      return null;
    } finally {
      setAdminProfileLoading(false);
    }
  };

  const handleOpenAdminProfile = async () => {
    setIsEditingAdminProfile(false);
    const profile = await fetchAdminProfile();
    if (profile) {
      setShowAdminProfile(true);
    }
  };

  const handleStartEditAdminProfile = () => setIsEditingAdminProfile(true);

  const handleCancelEditAdminProfile = () => {
    if (adminProfile) {
      setAdminProfileForm({
        firstname: adminProfile.firstname || "",
        lastname: adminProfile.lastname || "",
        email: adminProfile.email || "",
        contactNumber: adminProfile.contactNumber || "",
      });
    }
    setIsEditingAdminProfile(false);
  };

  const handleSaveAdminProfile = async () => {
    if (!adminProfile) return;
    setAdminProfileSaving(true);
    try {
      const updated = {
        firstname: adminProfileForm.firstname.trim(),
        lastname: adminProfileForm.lastname.trim(),
        email: adminProfileForm.email.trim(),
        contactNumber: adminProfileForm.contactNumber.trim(),
      };
      const res = await axios.put(`${API_URL}/users/${adminProfile.id}`, updated, authHeaders);
      setAdminProfile(res.data);
      setUser((prev) => ({
        ...prev,
        sub: res.data.firstname ? `${res.data.firstname} ${res.data.lastname || ""}`.trim() : (res.data.email || prev?.sub),
      }));
      setIsEditingAdminProfile(false);
      alert("Profile updated successfully.");
      setShowAdminProfile(false);
    } catch (err) {
      console.error("Failed to save admin profile", err);
      alert(err.response?.data?.message || "Unable to save profile. Please try again.");
    } finally {
      setAdminProfileSaving(false);
    }
  };

  const handleCloseAdminProfile = () => {
    setShowAdminProfile(false);
    setIsEditingAdminProfile(false);
  };
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    description: "",
    location: "",
    contactNumber: "",
    cuisineType: "",
    status: "active",
  });
  const [editRestaurantForm, setEditRestaurantForm] = useState({
    name: "",
    description: "",
    location: "",
    contactNumber: "",
    cuisineType: "",
    status: "active",
  });
  const [managerForm, setManagerForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    contactNumber: "",
  });
  const [managerConfirmPassword, setManagerConfirmPassword] = useState("");
  const [onboardError, setOnboardError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    color: "#111",
    background: "#fff",
  };

  const resetOnboardForm = () => {
    setOnboardForm({
      name: "",
      description: "",
      location: "",
      contactNumber: "",
      cuisineType: "",
      status: "active",
    });
    setSelectedExistingManagerId("");
    setOnboardError("");
  };

  const resetRestaurantForm = () => {
    setRestaurantForm({
      name: "",
      description: "",
      location: "",
      contactNumber: "",
      cuisineType: "",
      status: "active",
    });
    setEditRestaurantForm({
      name: "",
      description: "",
      location: "",
      contactNumber: "",
      cuisineType: "",
      status: "active",
    });
  };

  const openEditRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setEditRestaurantForm({
      name: restaurant.name || "",
      description: restaurant.description || "",
      location: restaurant.location || "",
      contactNumber: restaurant.contactNumber || "",
      cuisineType: restaurant.cuisineType || "",
      status: restaurant.status || "active",
    });
    setShowEditRestaurant(true);
  };

  const openAssignManager = (manager) => {
    setSelectedManager(manager);
    setSelectedRestaurantId("");
    setShowUpdateManager(true);
  };

  const handleViewManager = (manager) => {
    setSelectedManager(manager);
    setShowViewManager(true);
    setIsEditingManager(false);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewUser(true);
  };

  const handleStartEditManager = () => {
    setEditManagerForm({
      firstname: selectedManager.firstname,
      lastname: selectedManager.lastname,
      email: selectedManager.email,
      contactNumber: selectedManager.contactNumber || "",
    });
    setIsEditingManager(true);
  };

  const handleCancelEditManager = () => {
    setIsEditingManager(false);
  };

  const handleSaveManagerEdit = async () => {
    if (editManagerForm.contactNumber && editManagerForm.contactNumber.length !== 11) {
      alert("Contact number must be exactly 11 digits.");
      return;
    }
    setFormLoading(true);
    try {
      const res = await axios.put(`${API_URL}/users/${selectedManager.id}`, editManagerForm, authHeaders);
      alert("Manager details updated successfully!");
      
      // Update local state
      setManagers(prev => prev.map(m => m.id === selectedManager.id ? { ...m, ...res.data } : m));
      setSelectedManager({ ...selectedManager, ...res.data });
      setIsEditingManager(false);
    } catch (err) {
      console.error("Failed to update manager details", err);
      alert(err.response?.data?.message || "Failed to update manager details.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    setFormLoading(true);
    try {
      await axios.put(
        `${API_URL}/admin/restaurants/${selectedRestaurant.id}`,
        editRestaurantForm,
        authHeaders
      );
      await loadAll();
      setShowEditRestaurant(false);
      setSelectedRestaurant(null);
    } catch (err) {
      console.error("Failed to update restaurant", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleRestaurantStatus = async (restaurantId, currentStatus) => {
    setFormLoading(true);
    try {
      const endpoint = currentStatus === "active" ? "deactivate" : "activate";
      await axios.put(
        `${API_URL}/admin/restaurants/${restaurantId}/${endpoint}`,
        {},
        authHeaders
      );
      await loadAll();
    } catch (err) {
      console.error("Failed to toggle restaurant status", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    if (!window.confirm("Are you sure you want to delete this restaurant? This cannot be undone.")) return;
    setFormLoading(true);
    try {
      await axios.delete(`${API_URL}/restaurants/${restaurantId}`, authHeaders);
      await loadAll();
    } catch (err) {
      console.error("Failed to delete restaurant", err);
      alert("Unable to delete restaurant. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteManager = async (managerId) => {
    if (!window.confirm("Are you sure you want to delete this manager? This cannot be undone.")) return;
    setFormLoading(true);
    try {
      await axios.delete(`${API_URL}/users/${managerId}`, authHeaders);
      await loadAll();
    } catch (err) {
      console.error("Failed to delete manager", err);
      alert("Unable to delete manager. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    setFormLoading(true);
    try {
      const endpoint = isActive ? "deactivate" : "activate";
      await axios.put(`${API_URL}/admin/users/${userId}/${endpoint}`, {}, authHeaders);
      await loadAll();
    } catch (err) {
      console.error("Failed to update user status", err);
      alert("Unable to update user status. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    setFormLoading(true);
    try {
      await axios.delete(`${API_URL}/users/${userId}`, authHeaders);
      await loadAll();
    } catch (err) {
      console.error("Failed to delete user", err);
      alert("Unable to delete user. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await axios.post(`${API_URL}/admin/restaurants`, restaurantForm, authHeaders);
      resetRestaurantForm();
      setShowCreateRestaurant(false);
      await loadAll();
    } catch (err) {
      console.error("Failed to create restaurant", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleOnboardRestaurant = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await axios.post(
        `${API_URL}/admin/onboard-restaurant`,
        { ...onboardForm, existingManagerId: selectedExistingManagerId },
        authHeaders
      );
      alert(`Restaurant "${onboardForm.name}" onboarded successfully!`);
      resetOnboardForm();
      setShowOnboardRestaurant(false);
      await loadAll();
    } catch (err) {
      console.error("Failed to onboard restaurant", err);
      setOnboardError(
        err?.response?.data?.message || err?.message || "Unable to onboard restaurant."
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();
    if (managerForm.password !== managerConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (managerForm.contactNumber.length !== 11) {
      alert("Contact number must be exactly 11 digits.");
      return;
    }
    setFormLoading(true);
    try {
      await axios.post(`${API_URL}/admin/managers`, managerForm, authHeaders);
      alert(`Manager ${managerForm.firstname} ${managerForm.lastname} created successfully!`);
      setManagerForm({ firstname: "", lastname: "", email: "", password: "", contactNumber: "" });
      setManagerConfirmPassword("");
      setShowCreateManager(false);
      await loadAll();
    } catch (err) {
      alert("Failed to create manager. Please try again.");
      console.error("Failed to create manager", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleManagerStatus = async (managerId, isActive) => {
    setFormLoading(true);
    try {
      const endpoint = isActive ? "deactivate" : "activate";
      await axios.put(`${API_URL}/admin/managers/${managerId}/${endpoint}`, {}, authHeaders);
      await loadAll();
    } catch (err) {
      console.error("Failed to update manager status", err);
      alert("Unable to update manager status. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignManager = async (e) => {
    e.preventDefault();
    if (!selectedManager || !selectedRestaurantId) return;
    setFormLoading(true);
    try {
      await axios.put(
        `${API_URL}/admin/restaurants/${selectedRestaurantId}/assign/${selectedManager.id}`,
        {},
        authHeaders
      );
      setSelectedRestaurantId("");
      setShowUpdateManager(false);
      setSelectedManager(null);
      await loadAll();
    } catch (err) {
      console.error("Failed to assign manager", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleOrderDelete = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/orders/${orderId}`, authHeaders);
      await loadAll();
    } catch (err) {
      console.error("Failed to delete order", err);
      alert("Failed to delete order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleViewMenu = async (restaurant) => {
    setSelectedViewRestaurant(restaurant);
    setShowMenuModal(true);
    setMenuLoading(true);
    setShowAddMenuModal(false);
    setNewMenuItem({ name: "", description: "", price: "", category: "Main", availability: true });
    try {
      const res = await axios.get(`${API_URL}/customer/restaurants/${restaurant.id}/menu`, authHeaders);
      setRestaurantMenu(res.data || []);
    } catch (err) {
      console.error("Failed to fetch menu items", err);
      setRestaurantMenu([]);
    } finally {
      setMenuLoading(false);
    }
  };

  const handleDeleteMenuItem = async (menuItemId) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await axios.delete(`${API_URL}/manager/restaurants/${selectedViewRestaurant.id}/menu/${menuItemId}`, authHeaders);
      setRestaurantMenu(prev => prev.filter(item => item.id !== menuItemId));
    } catch (err) {
      console.error("Failed to delete menu item", err);
      alert("Failed to delete menu item.");
    }
  };

  const handleToggleMenuItemAvailability = async (menuItemId) => {
    try {
      const res = await axios.patch(`${API_URL}/manager/restaurants/${selectedViewRestaurant.id}/menu/${menuItemId}/availability`, {}, authHeaders);
      setRestaurantMenu(prev => prev.map(item => item.id === menuItemId ? res.data : item));
    } catch (err) {
      console.error("Failed to toggle availability", err);
      alert("Failed to update availability.");
    }
  };

  const closeAddMenuModal = () => {
    setShowAddMenuModal(false);
    setNewMenuItem({ name: "", description: "", price: "", category: "Main", availability: true });
  };

  const handleAddMenuItemAdmin = async () => {
    if (!selectedViewRestaurant || !newMenuItem.name.trim()) {
      alert("Please enter a menu item name");
      return;
    }
    setAddingMenuItem(true);
    try {
      // Admins use the manager endpoint since we updated it to allow ADMIN role
      const res = await axios.post(`${API_URL}/manager/restaurants/${selectedViewRestaurant.id}/menu`, {
        ...newMenuItem,
        price: parseFloat(newMenuItem.price) || 0
      }, authHeaders);
      
      alert("✓ Menu Item Added Successfully!");
      setRestaurantMenu(prev => [...prev, res.data]);
      setShowAddMenuModal(false);
      setNewMenuItem({ name: "", description: "", price: "", category: "Main", availability: true });
    } catch (err) {
      console.error("Failed to add menu item", err);
      alert(err.response?.data?.message || "Could not add the menu item.");
    } finally {
      setAddingMenuItem(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, { status: newStatus }, authHeaders);
      await loadAll();
      setShowOrderDetails(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error("Failed to update order status", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = order.items?.map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>${item.quantity}x ${item.menuItemName}</span>
        <span>₱${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('') || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - #${order.id?.slice(0, 8).toUpperCase()}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: #000; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 20px; margin-bottom: 20px; }
            .restaurant { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .details { font-size: 14px; margin-bottom: 20px; }
            .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant">QUICKBITE</div>
            <div>Official Receipt</div>
          </div>
          <div class="details">
            <div>Order ID: #${order.id?.toUpperCase()}</div>
            <div>Date: ${new Date(order.createdAt).toLocaleString()}</div>
            <div>Customer: ${order.customerName}</div>
            <div>Restaurant: ${order.restaurantName}</div>
            <div>Payment: ${order.paymentMethod?.toUpperCase()}</div>
          </div>
          <div class="items">
            ${itemsHtml}
          </div>
          <div class="total-row">
            <span>TOTAL</span>
            <span>₱${order.totalAmount?.toFixed(2)}</span>
          </div>
          <div class="details" style="margin-top: 20px;">
            <div>Address: ${order.deliveryAddress}</div>
          </div>
          <div class="footer">
            <p>Thank you for ordering with QuickBite!</p>
            <p>*** End of Receipt ***</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={styles.page}>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Confirm Delete</h3>
            <p style={styles.modalText}>Are you sure you want to delete this user? This cannot be undone.</p>
            <div style={styles.modalBtns}>
              <button onClick={() => setConfirmDelete(null)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={() => handleDeleteUser(confirmDelete.id)} style={styles.redBtn}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* FIX 3: Unified, complete Onboard Restaurant Modal */}
      {showOnboardRestaurant && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Onboard Restaurant</h3>
              <button
                type="button"
                onClick={() => { setShowOnboardRestaurant(false); resetOnboardForm(); }}
                style={styles.closeBtn}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardRestaurant} style={styles.form}>
              <h4 style={styles.sectionTitle}>Restaurant Details</h4>

              {[
                { label: "Name", key: "name", placeholder: "e.g. Jollibee Cebu" },
                { label: "Description", key: "description", placeholder: "Short description" },
                { label: "Location", key: "location", placeholder: "e.g. IT Park, Cebu City" },
                { label: "Contact Number", key: "contactNumber", placeholder: "e.g. +63 912 345 6789" },
                { label: "Cuisine Type", key: "cuisineType", placeholder: "e.g. Filipino, Fast Food" },
              ].map((field) => (
                <div key={field.key} style={styles.fieldGroup}>
                  <label htmlFor={`onboard-${field.key}`} style={styles.label}>{field.label}</label>
                  <input
                    id={`onboard-${field.key}`}
                    name={field.key}
                    value={onboardForm[field.key]}
                    onChange={(e) => setOnboardForm({ ...onboardForm, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    autoComplete="off"
                    style={inputStyle}
                  />
                </div>
              ))}

              <h4 style={styles.sectionTitle}>Manager</h4>
              <div style={styles.fieldGroup}>
                <label htmlFor="existing-manager" style={styles.label}>Select Manager</label>
                <select
                  id="existing-manager"
                  value={selectedExistingManagerId}
                  onChange={(e) => setSelectedExistingManagerId(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">-- Select a manager --</option>
                  {managersList
                    .filter(m => !restaurantsList.some(r => r.managerId === m.id))
                    .map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.firstname && manager.lastname
                          ? `${manager.firstname} ${manager.lastname}`
                          : manager.email}
                      </option>
                    ))}
                </select>
              </div>

              {onboardError && (
                <p style={styles.errorText}>{onboardError}</p>
              )}

              <div style={styles.modalBtns}>
                <button
                  type="button"
                  onClick={() => { setShowOnboardRestaurant(false); resetOnboardForm(); }}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} style={styles.orangeBtn}>
                  {formLoading ? "Onboarding..." : "Onboard Restaurant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Restaurant Modal */}
      {showCreateRestaurant && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Create Restaurant</h3>
            <form onSubmit={handleCreateRestaurant} style={styles.form}>
              {[
                { label: "Name", key: "name", placeholder: "e.g. Jollibee Cebu" },
                { label: "Description", key: "description", placeholder: "Short description" },
                { label: "Location", key: "location", placeholder: "e.g. IT Park, Cebu City" },
                { label: "Contact Number", key: "contactNumber", placeholder: "e.g. +63 912 345 6789" },
                { label: "Cuisine Type", key: "cuisineType", placeholder: "e.g. Filipino, Fast Food" },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={styles.fieldGroup}>
                  <label htmlFor={`restaurant-${key}`} style={styles.label}>{label}</label>
                  <input
                    id={`restaurant-${key}`}
                    name={key}
                    value={restaurantForm[key]}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    required
                    autoComplete="off"
                    style={inputStyle}
                  />
                </div>
              ))}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Status</label>
                <select
                  value={restaurantForm.status}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, status: e.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={styles.modalBtns}>
                <button type="button" onClick={() => setShowCreateRestaurant(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={formLoading} style={styles.orangeBtn}>
                  {formLoading ? "Creating..." : "Create Restaurant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditRestaurant && selectedRestaurant && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Update Restaurant</h3>
            <form onSubmit={handleUpdateRestaurant} style={styles.form}>
              {[
                { label: "Name", key: "name", placeholder: "e.g. Jollibee Cebu" },
                { label: "Description", key: "description", placeholder: "Short description" },
                { label: "Location", key: "location", placeholder: "e.g. IT Park, Cebu City" },
                { label: "Contact Number", key: "contactNumber", placeholder: "e.g. +63 912 345 6789" },
                { label: "Cuisine Type", key: "cuisineType", placeholder: "e.g. Filipino, Fast Food" },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={styles.fieldGroup}>
                  <label htmlFor={`edit-restaurant-${key}`} style={styles.label}>{label}</label>
                  <input
                    id={`edit-restaurant-${key}`}
                    name={key}
                    value={editRestaurantForm[key]}
                    onChange={(e) => setEditRestaurantForm({ ...editRestaurantForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    required
                    autoComplete="off"
                    style={inputStyle}
                  />
                </div>
              ))}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Status</label>
                <select
                  value={editRestaurantForm.status}
                  onChange={(e) => setEditRestaurantForm({ ...editRestaurantForm, status: e.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={styles.modalBtns}>
                <button type="button" onClick={() => { setShowEditRestaurant(false); setSelectedRestaurant(null); }} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={formLoading} style={styles.orangeBtn}>
                  {formLoading ? "Saving..." : "Update Restaurant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Manager Modal */}
      {showCreateManager && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Create Manager Account</h3>
            <form onSubmit={handleCreateManager} style={styles.form}>
              <div style={styles.twoCol}>
                <div style={styles.fieldGroup}>
                  <label htmlFor="manager-firstname" style={styles.label}>First Name</label>
                  <input id="manager-firstname" name="firstname" value={managerForm.firstname} onChange={(e) => setManagerForm({ ...managerForm, firstname: e.target.value })} placeholder="John" required autoComplete="given-name" style={inputStyle} />
                </div>
                <div style={styles.fieldGroup}>
                  <label htmlFor="manager-lastname" style={styles.label}>Last Name</label>
                  <input id="manager-lastname" name="lastname" value={managerForm.lastname} onChange={(e) => setManagerForm({ ...managerForm, lastname: e.target.value })} placeholder="Doe" required autoComplete="family-name" style={inputStyle} />
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email</label>
                <input id="manager-email" name="email" type="email" value={managerForm.email} onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })} placeholder="manager@example.com" required autoComplete="email" style={inputStyle} />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Contact Number</label>
                <input 
                  id="manager-contact" 
                  name="contactNumber" 
                  type="text" 
                  value={managerForm.contactNumber} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setManagerForm({ ...managerForm, contactNumber: val });
                  }} 
                  placeholder="e.g. 09123456789 (11 digits)" 
                  required 
                  style={inputStyle} 
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Password</label>
                <input id="manager-password" name="password" type="password" value={managerForm.password} onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })} placeholder="Min. 8 characters" required minLength={8} autoComplete="new-password" style={inputStyle} />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Confirm Password</label>
                <input id="manager-confirm-password" name="confirmPassword" type="password" value={managerConfirmPassword} onChange={(e) => setManagerConfirmPassword(e.target.value)} placeholder="Re-enter password" required minLength={8} autoComplete="new-password" style={inputStyle} />
              </div>
              <div style={styles.modalBtns}>
                <button type="button" onClick={() => setShowCreateManager(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={formLoading} style={styles.orangeBtn}>
                  {formLoading ? "Creating..." : "Create Manager"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Restaurant Modal */}
      {showUpdateManager && selectedManager && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Assign Restaurant</h3>
            <p style={styles.modalText}>Assigning restaurant for: <strong>{selectedManager.firstname} {selectedManager.lastname}</strong></p>
            <form onSubmit={handleAssignManager} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Select Restaurant</label>
                <select
                  value={selectedRestaurantId}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                  required
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">-- Select a restaurant --</option>
                  {restaurantsList
                    .filter((restaurant) => !restaurant.managerId || restaurant.managerId === selectedManager.id)
                    .map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.name || restaurant.location || restaurant.id}
                      </option>
                    ))}
                </select>
              </div>
              <div style={styles.modalBtns}>
                <button type="button" onClick={() => { setShowUpdateManager(false); setSelectedManager(null); }} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={formLoading} style={styles.orangeBtn}>
                  {formLoading ? "Updating..." : "Update Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Manager Details Modal */}
      {showViewManager && selectedManager && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: "500px" }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Manager Details</h3>
              <button onClick={() => { setShowViewManager(false); setSelectedManager(null); }} style={styles.closeBtn}>✕</button>
            </div>
            
            <div style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "2rem", padding: "15px", background: "#f8fafc", borderRadius: "12px" }}>
                <div style={{ ...styles.tableAvatar, width: "60px", height: "60px", fontSize: "24px", background: "#eff6ff", color: "#2563eb" }}>
                  {selectedManager.firstname?.charAt(0)?.toUpperCase()}
                </div>
                {isEditingManager ? (
                  <div style={{ flex: 1, display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>First Name</p>
                      <input 
                        style={{ ...inputStyle, padding: "8px" }} 
                        value={editManagerForm.firstname} 
                        onChange={(e) => setEditManagerForm({ ...editManagerForm, firstname: e.target.value })}
                        placeholder="First Name"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Last Name</p>
                      <input 
                        style={{ ...inputStyle, padding: "8px" }} 
                        value={editManagerForm.lastname} 
                        onChange={(e) => setEditManagerForm({ ...editManagerForm, lastname: e.target.value })}
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1a1a1a" }}>{selectedManager.firstname} {selectedManager.lastname}</h4>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>{selectedManager.email}</p>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "1.5rem" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Account Status</p>
                  <span style={{
                    ...styles.pill,
                    background: selectedManager.active ? "#ecfdf5" : "#fef2f2",
                    color: selectedManager.active ? "#16a34a" : "#dc2626",
                  }}>
                    {selectedManager.active ? "Active" : "Disabled"}
                  </span>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Role</p>
                  <span style={{ ...styles.pill, background: "#eff6ff", color: "#2563eb" }}>{selectedManager.role}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "1.5rem" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Contact Number</p>
                  {isEditingManager ? (
                    <input 
                      style={{ ...inputStyle, padding: "8px" }} 
                      value={editManagerForm.contactNumber} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setEditManagerForm({ ...editManagerForm, contactNumber: val });
                      }}
                      placeholder="11-digit number"
                    />
                  ) : (
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#333" }}>
                      {selectedManager.contactNumber || "Not provided"}
                    </p>
                  )}
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Email Address</p>
                  {isEditingManager ? (
                    <input 
                      style={{ ...inputStyle, padding: "8px" }} 
                      type="email"
                      value={editManagerForm.email} 
                      onChange={(e) => setEditManagerForm({ ...editManagerForm, email: e.target.value })}
                      placeholder="manager@example.com"
                    />
                  ) : (
                    <p style={{ margin: 0, fontSize: "14px", color: "#333" }}>{selectedManager.email}</p>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "1.5rem" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Assigned Restaurant</p>
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#333" }}>
                    {(() => {
                      const assignedRestaurant = restaurantsList.find((r) => r.managerId === selectedManager.id);
                      return assignedRestaurant ? `🏪 ${assignedRestaurant.name}` : "Unassigned";
                    })()}
                  </p>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Joined Date</p>
                  <p style={{ margin: 0, fontSize: "14px", color: "#333" }}>
                    {formatDate(selectedManager.createdAt)}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Manager ID</p>
                <p style={{ margin: 0, fontSize: "13px", fontFamily: "monospace", color: "#666" }}>{selectedManager.id}</p>
              </div>
            </div>

            <div style={styles.modalBtns}>
              {isEditingManager ? (
                <>
                  <button onClick={handleSaveManagerEdit} disabled={formLoading} style={{ ...styles.orangeBtn, flex: 1 }}>
                    {formLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button onClick={handleCancelEditManager} style={{ ...styles.cancelBtn, flex: 1 }}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={handleStartEditManager} style={{ ...styles.assignBtn, flex: 1, padding: "10px", borderRadius: "10px" }}>Edit Profile</button>
                  <button
                    onClick={() => { setShowViewManager(false); openAssignManager(selectedManager); }}
                    style={{ ...styles.assignBtn, flex: 1, padding: "10px", borderRadius: "10px", background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}
                  >
                    Assign Restaurant
                  </button>
                  <button onClick={() => { setShowViewManager(false); setSelectedManager(null); }} style={{ ...styles.orangeBtn, flex: 1 }}>Close</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showViewUser && selectedUser && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: "520px" }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>User Details</h3>
              <button onClick={() => { setShowViewUser(false); setSelectedUser(null); }} style={styles.closeBtn}>✕</button>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "2rem", padding: "15px", background: "#f8fafc", borderRadius: "12px" }}>
                <div style={{ ...styles.tableAvatar, width: "60px", height: "60px", fontSize: "24px", background: selectedUser.role === "ADMIN" ? "#fdf2f8" : selectedUser.role?.includes("MANAGER") ? "#eff6ff" : "#ecfdf5", color: selectedUser.role === "ADMIN" ? "#9333ea" : selectedUser.role?.includes("MANAGER") ? "#2563eb" : "#16a34a" }}>
                  {selectedUser.firstname?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1a1a1a" }}>{selectedUser.firstname} {selectedUser.lastname}</h4>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>{selectedUser.email}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "1.5rem" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Account Status</p>
                  <span style={{
                    ...styles.pill,
                    background: selectedUser.active ? "#ecfdf5" : "#fef2f2",
                    color: selectedUser.active ? "#16a34a" : "#dc2626",
                  }}>
                    {selectedUser.active ? "Active" : "Disabled"}
                  </span>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Role</p>
                  <span style={{ ...styles.pill, background: selectedUser.role === "ADMIN" ? "#fdf2f8" : selectedUser.role?.includes("MANAGER") ? "#eff6ff" : "#f0fdf4", color: selectedUser.role === "ADMIN" ? "#9333ea" : selectedUser.role?.includes("MANAGER") ? "#2563eb" : "#16a34a" }}>{selectedUser.role}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "1.5rem" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Contact Number</p>
                  <p style={{ margin: 0, fontSize: "14px", color: "#333" }}>{selectedUser.contactNumber || "Not provided"}</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Joined Date</p>
                  <p style={{ margin: 0, fontSize: "14px", color: "#333" }}>{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>User ID</p>
                <p style={{ margin: 0, fontSize: "13px", fontFamily: "monospace", color: "#666" }}>{selectedUser.id}</p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Orders</p>
                {selectedUserOrders.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>No orders found for this user.</p>
                ) : (
                  <div style={{ display: "grid", gap: "12px" }}>
                    {selectedUserOrders.map((order) => (
                      <div key={order.id} style={{ padding: "14px", border: "1px solid #e2e8f0", borderRadius: "14px", display: "grid", gridTemplateColumns: "1fr auto", gap: "16px" }}>
                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: "#111827" }}>Order #{order.id?.slice(0, 8).toUpperCase()}</p>
                          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{order.restaurantName || order.customerName || order.user?.email || "Order details"}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ ...styles.pill, background: statusColor(order.status).bg, color: statusColor(order.status).color }}>{order.status || "—"}</span>
                          <p style={{ margin: "8px 0 0", fontSize: "14px", fontWeight: "700", color: "#111827" }}>₱{order.totalAmount?.toFixed(2) || "0.00"}</p>
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ ...styles.modalBtns, display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => { setShowViewUser(false); setSelectedUser(null); }} style={styles.cancelBtn}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.5 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3.5-7-7-7z" fill="white"/>
              <circle cx="12" cy="9" r="2.5" fill="#FF6B35"/>
            </svg>
          </div>
          <span style={styles.logoText}>QuickBite</span>
        </div>

        <div style={styles.roleTag}>Administrator</div>

        <nav style={styles.nav}>
          {[
            { key: "overview",    label: "Overview",    icon: "📊" },
            { key: "users",       label: "Users",       icon: "👥", badge: userStats.total },
            { key: "restaurants", label: "Restaurants", icon: "🏪", badge: restaurantsList.length },
            { key: "managers",    label: "Managers",    icon: "👨‍💼", badge: managersList.length },
            { key: "orders",      label: "Orders",      icon: "📦", badge: ordersList.length },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={{
                ...styles.navBtn,
                background: activeTab === item.key ? "#fff4f0" : "transparent",
                color: activeTab === item.key ? "#FF6B35" : "#555",
                fontWeight: activeTab === item.key ? "600" : "400",
              }}
            >
              <span style={{ fontSize: "18px" }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && <span style={styles.badge}>{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={{ ...styles.userInfo, cursor: "pointer" }} onClick={handleOpenAdminProfile}>
            <div style={styles.avatar}>{user?.sub?.charAt(0)?.toUpperCase() || "A"}</div>
            <div>
              <p style={styles.userName}>{user?.sub || "Admin"}</p>
              <p style={styles.userRole}>Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </aside>

      {showAdminProfile && adminProfile && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: "520px" }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Your Profile</h3>
              <button onClick={handleCloseAdminProfile} style={styles.closeBtn}>✕</button>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <div style={{ display: "grid", gap: "20px" }}>
                <div style={{ display: "flex", gap: "15px", alignItems: "center", padding: "15px", background: "#f8fafc", borderRadius: "12px" }}>
                  <div style={{ ...styles.tableAvatar, width: "60px", height: "60px", fontSize: "24px", background: "#eef2ff", color: "#3730a3" }}>
                    {adminProfile.firstname?.charAt(0)?.toUpperCase() || adminProfile.email?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#111827" }}>{adminProfile.firstname} {adminProfile.lastname}</h4>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>{adminProfile.email}</p>
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>First Name</label>
                  {isEditingAdminProfile ? (
                    <input
                      type="text"
                      value={adminProfileForm.firstname}
                      onChange={(e) => setAdminProfileForm({ ...adminProfileForm, firstname: e.target.value })}
                      style={inputStyle}
                      placeholder="First name"
                    />
                  ) : (
                    <p style={styles.readOnlyValue}>{adminProfile.firstname || "Not provided"}</p>
                  )}
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Last Name</label>
                  {isEditingAdminProfile ? (
                    <input
                      type="text"
                      value={adminProfileForm.lastname}
                      onChange={(e) => setAdminProfileForm({ ...adminProfileForm, lastname: e.target.value })}
                      style={inputStyle}
                      placeholder="Last name"
                    />
                  ) : (
                    <p style={styles.readOnlyValue}>{adminProfile.lastname || "Not provided"}</p>
                  )}
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Email</label>
                  {isEditingAdminProfile ? (
                    <input
                      type="email"
                      value={adminProfileForm.email}
                      onChange={(e) => setAdminProfileForm({ ...adminProfileForm, email: e.target.value })}
                      style={inputStyle}
                      placeholder="Email address"
                    />
                  ) : (
                    <p style={styles.readOnlyValue}>{adminProfile.email || "Not provided"}</p>
                  )}
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Contact Number</label>
                  {isEditingAdminProfile ? (
                    <input
                      type="text"
                      value={adminProfileForm.contactNumber}
                      onChange={(e) => setAdminProfileForm({ ...adminProfileForm, contactNumber: e.target.value })}
                      style={inputStyle}
                      placeholder="Contact number"
                    />
                  ) : (
                    <p style={styles.readOnlyValue}>{adminProfile.contactNumber || "Not provided"}</p>
                  )}
                </div>
              </div>
            </div>
            <div style={{ ...styles.modalBtns, display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              {isEditingAdminProfile ? (
                <>
                  <button onClick={handleCancelEditAdminProfile} style={styles.cancelBtn}>Cancel</button>
                  <button onClick={handleSaveAdminProfile} disabled={adminProfileSaving} style={styles.orangeBtn}>
                    {adminProfileSaving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button onClick={handleStartEditAdminProfile} style={styles.orangeBtn}>Edit Profile</button>
              )}
              <button onClick={handleCloseAdminProfile} style={styles.cancelBtn}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              {activeTab === "overview"    && "Admin Dashboard"}
              {activeTab === "users"       && "Manage Users"}
              {activeTab === "restaurants" && "Manage Restaurants"}
              {activeTab === "managers"    && "Manage Managers"}
              {activeTab === "orders"      && "All Orders"}
            </h1>
            <p style={styles.pageSubtitle}>
              {activeTab === "overview"    && "System overview and stats"}
              {activeTab === "users"       && `${userStats.total} registered users`}
              {activeTab === "restaurants" && `${restaurantsList.length} restaurants`}
              {activeTab === "managers"    && `${managersList.length} managers`}
              {activeTab === "orders"      && `${ordersList.length} total orders`}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {activeTab === "restaurants" && (
              <button onClick={() => setShowOnboardRestaurant(true)} style={styles.primaryBtn}>+ Onboard Restaurant</button>
            )}
            {activeTab === "managers" && (
              <button onClick={() => setShowCreateManager(true)} style={styles.primaryBtn}>+ New Manager</button>
            )}
            <button onClick={loadAll} style={styles.refreshBtn}>↻ Refresh</button>
          </div>
        </div>

        {loading && (
          <div style={styles.loadingRow}>
            <div style={styles.spinner} />
            <span style={{ color: "#aaa", fontSize: "14px" }}>Loading...</span>
          </div>
        )}

        {/* Overview */}
        {activeTab === "overview" && !loading && (
          <div style={styles.overviewGrid}>
            {[
              { icon: "👥", label: "Total Users",   value: userStats.total },
              { icon: "🍽️", label: "Customers",     value: userStats.customers },
              { icon: "👨‍💼", label: "Managers",      value: userStats.managers },
              { icon: "🏪", label: "Restaurants",   value: restaurantsList.length },
              { icon: "📦", label: "Total Orders",  value: ordersList.length },
              { icon: "💰", label: "Total Revenue", value: `₱${totalRevenue.toFixed(2)}` },
            ].map((s) => (
              <div key={s.label} style={styles.statCard}>
                <div style={styles.statIcon}>{s.icon}</div>
                <div>
                  <p style={styles.statLabel}>{s.label}</p>
                  <p style={styles.statValue}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {activeTab === "users" && !loading && (
          <>
            <div style={styles.statusGrid}>
              <div style={styles.statusCard}>
                <p style={styles.statusLabel}>Active users</p>
                <p style={styles.statusValue}>{userStats.active}</p>
              </div>
              <div style={{ ...styles.statusCard, background: "#fef2f2", borderColor: "#fecaca" }}>
                <p style={styles.statusLabel}>Disabled users</p>
                <p style={styles.statusValue}>{userStats.disabled}</p>
              </div>
            </div>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>{["Name", "Email", "Role", "Status", "Created At", "Action"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {nonAdminUsers.length === 0 ? (
                    <tr><td colSpan={6} style={styles.emptyCell}>No users yet.</td></tr>
                  ) : nonAdminUsers.map((u) => (
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <div style={styles.tableAvatar}>{u.firstname?.charAt(0)?.toUpperCase()}</div>
                          <span>{u.firstname} {u.lastname}</span>
                        </div>
                      </td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.pill,
                          background: u.role === "ADMIN" ? "#fdf2f8" : u.role?.includes("MANAGER") ? "#eff6ff" : "#f0fdf4",
                          color: u.role === "ADMIN" ? "#9333ea" : u.role?.includes("MANAGER") ? "#2563eb" : "#16a34a",
                        }}>{u.role}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.pill,
                          background: u.active ? "#ecfdf5" : "#fef2f2",
                          color: u.active ? "#16a34a" : "#dc2626",
                        }}>
                          {u.active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td style={styles.td}>{formatDate(u.createdAt)}</td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleViewUser(u)}
                            style={{ ...styles.assignBtn, background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.active)}
                            style={u.active ? styles.deleteRowBtn : { ...styles.assignBtn, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                          >
                            {u.active ? "Disable" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            style={{ ...styles.deleteRowBtn, background: "#fff1f2", color: "#b91c1c", border: "1px solid #fecaca" }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Restaurants */}
        {activeTab === "restaurants" && !loading && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>{["Restaurant", "Location", "Contact", "Cuisine", "Status", "Manager ID", "Assigned Manager", "Action"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {restaurantsList.length === 0 ? (
                  <tr><td colSpan={8} style={styles.emptyCell}>No restaurants yet. Click "+ Onboard Restaurant" to add one.</td></tr>
                ) : restaurantsList.map((r) => (
                  <tr key={r.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        <div style={{ ...styles.tableAvatar, background: "#fff4f0", color: "#FF6B35" }}>🏪</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: "600", fontSize: "14px" }}>{r.name}</p>
                          <p style={{ margin: 0, fontSize: "11px", color: "#aaa" }}>{r.description}</p>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{r.location || "—"}</td>
                    <td style={styles.td}>{r.contactNumber || "—"}</td>
                    <td style={styles.td}>{r.cuisineType || "—"}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.pill, background: r.status === "active" ? "#f0fdf4" : "#fef2f2", color: r.status === "active" ? "#16a34a" : "#dc2626" }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={styles.td}>{r.managerId || "—"}</td>
                    <td style={styles.td}>{r.managerName || "Unassigned"}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleViewMenu(r)}
                          style={{ ...styles.pill, background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", cursor: "pointer" }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditRestaurant(r)}
                          style={{ ...styles.assignBtn, background: "#fff7ed", color: "#ea580c", border: "1px solid #ffd8c2" }}
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleToggleRestaurantStatus(r.id, r.status)}
                          style={r.status === "active" ? styles.deleteRowBtn : { ...styles.assignBtn, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                        >
                          {r.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteRestaurant(r.id)}
                          style={styles.deleteRowBtn}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Managers */}
        {activeTab === "managers" && !loading && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>{["Manager", "Email", "Role", "Status", "Assigned Restaurant", "Action"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {managersList.length === 0 ? (
                  <tr><td colSpan={5} style={styles.emptyCell}>No managers yet. Click "+New Manager" to add one.</td></tr>
                ) : managersList.map((m) => {
                  const assignedRestaurant = restaurantsList.find((restaurant) => restaurant.managerId === m.id);
                  return (
                    <tr key={m.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <div style={{ ...styles.tableAvatar, background: "#eff6ff", color: "#2563eb" }}>{m.firstname?.charAt(0)?.toUpperCase()}</div>
                          <span>{m.firstname} {m.lastname}</span>
                        </div>
                      </td>
                      <td style={styles.td}>{m.email}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.pill, background: "#eff6ff", color: "#2563eb" }}>{m.role}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.pill,
                          background: m.active ? "#ecfdf5" : "#fef2f2",
                          color: m.active ? "#16a34a" : "#dc2626",
                        }}>
                          {m.active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td style={styles.td}>{assignedRestaurant?.name || "Unassigned"}</td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleViewManager(m)}
                            style={{ ...styles.pill, background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", cursor: "pointer" }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleToggleManagerStatus(m.id, m.active)}
                            style={m.active ? styles.deleteRowBtn : { ...styles.assignBtn, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                          >
                            {m.active ? "Disable" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDeleteManager(m.id)}
                            style={styles.deleteRowBtn}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Orders */}
        {activeTab === "orders" && !loading && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>{["Order ID", "Customer", "Address", "Payment", "Total", "Status", "Date", "Action"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {ordersList.length === 0 ? (
                  <tr><td colSpan={8} style={styles.emptyCell}>No orders yet.</td></tr>
                ) : ordersList.map((o) => {
                  const sc = statusColor(o.status);
                  return (
                    <tr key={o.id} style={styles.tr}>
                      <td style={styles.td}><span style={{ fontFamily: "monospace", fontWeight: "700" }}>#{o.id?.slice(0, 8).toUpperCase()}</span></td>
                      <td style={styles.td}>{o.customerName || o.user?.email || "—"}</td>
                      <td style={styles.td}>{o.deliveryAddress || "—"}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.pill, background: "#f1f5f9", color: "#64748b" }}>
                          {o.paymentMethod === "cash_on_delivery" ? "💵 Cash" : 
                           o.paymentMethod === "gcash" ? "📱 GCash" : 
                           o.paymentMethod === "maya" ? "💳 Maya" : o.paymentMethod || "—"}
                        </span>
                      </td>
                      <td style={styles.td}><strong style={{ color: "#FF6B35" }}>₱{o.totalAmount?.toFixed(2)}</strong></td>
                      <td style={styles.td}><span style={{ ...styles.pill, background: sc.bg, color: sc.color }}>{o.status}</span></td>
                      <td style={styles.td}>{formatDate(o.createdAt)}</td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleViewOrder(o)}
                            style={{ ...styles.pill, background: "#f1f5f9", color: "#1e293b", border: "1px solid #e2e8f0", cursor: "pointer" }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleOrderDelete(o.id)}
                            style={styles.deleteRowBtn}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* View Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div style={styles.overlay}>
            <div style={{ ...styles.modal, maxWidth: "500px" }}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Order Details</h3>
                <button onClick={() => setShowOrderDetails(false)} style={styles.closeBtn}>✕</button>
              </div>
              
              <div style={{ marginTop: "1rem" }}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Restaurant</p>
                  <p style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1a1a1a" }}>🏪 {selectedOrder.restaurantName}</p>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Items</p>
                  <div style={{ background: "#f9f9f9", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ background: "#FF6B35", color: "white", padding: "2px 6px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>x{item.quantity}</span>
                          <span style={{ fontWeight: "500", color: "#333" }}>{item.menuItemName}</span>
                        </div>
                        <span style={{ color: "#666" }}>₱{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "1.5rem" }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Payment Method</p>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#333" }}>
                      {selectedOrder.paymentMethod === "cash_on_delivery" ? "💵 Cash" : 
                       selectedOrder.paymentMethod === "gcash" ? "📱 GCash" : 
                       selectedOrder.paymentMethod === "maya" ? "💳 Maya" : selectedOrder.paymentMethod}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Total Amount</p>
                    <p style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#FF6B35" }}>₱{selectedOrder.totalAmount?.toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Delivery Address</p>
                  <p style={{ margin: 0, fontSize: "14px", color: "#555", lineHeight: "1.5" }}>📍 {selectedOrder.deliveryAddress}</p>
                </div>
              </div>

              <div style={styles.modalBtns}>
                {selectedOrder.status?.toUpperCase() === "PLACED" && (
                  <>
                    <button 
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, "PREPARING")} 
                      style={{ ...styles.orangeBtn, background: "#16a34a" }}
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, "CANCELLED")} 
                      style={{ ...styles.orangeBtn, background: "#ef4444" }}
                    >
                      Cancel Order
                    </button>
                  </>
                )}
                {selectedOrder.status?.toUpperCase() === "PREPARING" && (
                  <button 
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, "OUT_FOR_DELIVERY")} 
                    style={{ ...styles.orangeBtn, background: "#2563eb" }}
                  >
                    Mark as Ready
                  </button>
                )}
                {selectedOrder.status?.toUpperCase() === "OUT_FOR_DELIVERY" && (
                  <button 
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, "DELIVERED")} 
                    style={{ ...styles.orangeBtn, background: "#16a34a" }}
                  >
                    Mark as Delivered
                  </button>
                )}
                {selectedOrder.status?.toUpperCase() === "DELIVERED" && (
                  <button 
                    onClick={() => handlePrintReceipt(selectedOrder)} 
                    style={{ ...styles.orangeBtn, background: "#16a34a" }}
                  >
                    🖨️ Print Receipt
                  </button>
                )}
                <button onClick={() => setShowOrderDetails(false)} style={styles.cancelBtn}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* View Restaurant Menu Modal */}
        {showMenuModal && selectedViewRestaurant && (
          <div style={styles.overlay}>
            <div style={{ ...styles.modal, maxWidth: "600px" }}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Restaurant Menu</h3>
                <button onClick={() => setShowMenuModal(false)} style={styles.closeBtn}>✕</button>
              </div>
              
              <div style={{ marginTop: "1rem" }}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Restaurant</p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1a1a1a" }}>🏪 {selectedViewRestaurant.name}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#666" }}>{selectedViewRestaurant.description}</p>
                </div>

                <div>
                  <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#aaa", textTransform: "uppercase", fontWeight: "600" }}>Menu Items</p>
                  {menuLoading ? (
                    <div style={{ padding: "40px 0", textAlign: "center" }}>
                      <div style={styles.spinner} />
                      <p style={{ marginTop: "12px", color: "#aaa" }}>Loading menu items...</p>
                    </div>
                  ) : restaurantMenu.length === 0 ? (
                    <div style={{ padding: "40px 0", textAlign: "center", background: "#f9f9f9", borderRadius: "12px" }}>
                      <span style={{ fontSize: "32px" }}>🍽️</span>
                      <p style={{ marginTop: "12px", color: "#666" }}>No menu items found for this restaurant.</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "5px" }}>
                      {restaurantMenu.map((item) => (
                        <div key={item.id} style={{ 
                          padding: "12px", 
                          background: "#fff", 
                          borderRadius: "12px", 
                          border: "1px solid #eee",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <span style={{ fontWeight: "700", color: "#333" }}>{item.name}</span>
                              <button 
                                onClick={() => handleToggleMenuItemAvailability(item.id)}
                                style={{ 
                                  fontSize: "10px", 
                                  padding: "2px 6px", 
                                  borderRadius: "10px", 
                                  background: item.availability ? "#f0fdf4" : "#fef2f2",
                                  color: item.availability ? "#16a34a" : "#dc2626",
                                  border: `1px solid ${item.availability ? "#bbf7d0" : "#fecaca"}`,
                                  cursor: "pointer"
                                }}
                              >
                                {item.availability ? "Available" : "Unavailable"}
                              </button>
                            </div>
                            <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>{item.description || "No description"}</p>
                            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#aaa" }}>Category: {item.category || "General"}</p>
                          </div>
                          <div style={{ marginLeft: "15px", textAlign: "right", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <span style={{ fontWeight: "800", color: "#FF6B35", fontSize: "15px" }}>₱{item.price?.toFixed(2)}</span>
                            <button 
                              onClick={() => handleDeleteMenuItem(item.id)}
                              style={{ 
                                background: "#fef2f2", 
                                color: "#dc2626", 
                                border: "1px solid #fecaca", 
                                borderRadius: "6px", 
                                padding: "4px 8px", 
                                fontSize: "11px", 
                                fontWeight: "600", 
                                cursor: "pointer" 
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ ...styles.modalBtns, marginTop: "2rem" }}>
                {!showAddMenuModal && (
                  <button 
                    onClick={() => setShowAddMenuModal(true)} 
                    style={styles.primaryBtn}
                  >
                    + Add Menu Item
                  </button>
                )}
                <button onClick={() => setShowMenuModal(false)} style={styles.cancelBtn}>Close Menu</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Menu Item Modal (Manager-style) */}
        {showAddMenuModal && (
          <div style={styles.menuModalOverlay}>
            <div style={styles.menuModalContent}>
              <div style={styles.menuModalBody}>
                <h2 style={styles.menuModalTitle}>Add Menu Item</h2>
                <label style={styles.menuModalLabel}>Name</label>
                <input
                  type="text"
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                  style={styles.menuModalInput}
                  placeholder="Item name"
                />
                <label style={styles.menuModalLabel}>Description</label>
                <textarea
                  value={newMenuItem.description}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                  style={styles.menuModalTextarea}
                  placeholder="Item description"
                />
                <div style={styles.menuModalRow}>
                  <div style={styles.menuModalField}>
                    <label style={styles.menuModalLabel}>Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newMenuItem.price}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                      style={styles.menuModalInput}
                      placeholder="₱0.00"
                    />
                  </div>
                  <div style={styles.menuModalField}>
                    <label style={styles.menuModalLabel}>Category</label>
                    <input
                      type="text"
                      value={newMenuItem.category}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                      style={styles.menuModalInput}
                      placeholder="Main, Dessert, Drink"
                    />
                  </div>
                </div>
                <div style={styles.menuModalActions}>
                  <button onClick={closeAddMenuModal} style={styles.menuSecondaryBtn}>
                    Cancel
                  </button>
                  <button onClick={handleAddMenuItemAdmin} style={styles.menuPrimaryBtn} disabled={addingMenuItem}>
                    {addingMenuItem ? "Adding…" : "Save Item"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { display: "flex", minHeight: "100vh", background: "#f7f5f2", fontFamily: "'Segoe UI', sans-serif" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "white", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "460px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  modalTitle: { fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: 0 },
  modalText: { fontSize: "14px", color: "#888", margin: "0 0 1.25rem", lineHeight: "1.6" },
  modalBtns: { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "1.25rem" },
  closeBtn: { background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#aaa", padding: "4px 8px", borderRadius: "6px" },
  cancelBtn: { padding: "9px 18px", borderRadius: "8px", border: "1px solid #ececec", background: "white", fontSize: "14px", cursor: "pointer", color: "#555" },
  redBtn: { padding: "9px 18px", borderRadius: "8px", border: "none", background: "#ef4444", color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  orangeBtn: { padding: "9px 18px", borderRadius: "8px", border: "none", background: "#FF6B35", color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "5px" },
  sectionTitle: { margin: "8px 0 4px", fontSize: "14px", fontWeight: "700", color: "#1a1a1a" },
  errorText: { color: "#b91c1c", fontSize: "13px", margin: "0 0 0.5rem" },
  label: { fontSize: "13px", fontWeight: "500", color: "#555" },
  readOnlyValue: { margin: 0, fontSize: "14px", color: "#333", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#fbfbfb" },
  sidebar: { width: "240px", minHeight: "100vh", background: "#ffffff", borderRight: "1px solid #ececec", display: "flex", flexDirection: "column", padding: "1.5rem 1rem", position: "fixed", top: 0, left: 0, bottom: 0 },
  logoRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem", paddingLeft: "4px" },
  logoIcon: { width: "36px", height: "36px", borderRadius: "10px", background: "#FF6B35", display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: "17px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-0.3px" },
  roleTag: { fontSize: "11px", fontWeight: "600", color: "#9333ea", background: "#fdf2f8", borderRadius: "6px", padding: "4px 10px", marginBottom: "1.25rem", display: "inline-block" },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navBtn: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", textAlign: "left", transition: "background 0.15s" },
  badge: { marginLeft: "auto", background: "#FF6B35", color: "white", borderRadius: "999px", fontSize: "11px", fontWeight: "700", padding: "2px 7px" },
  sidebarFooter: { borderTop: "1px solid #f0f0f0", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto", paddingBottom: "1rem" },
  userInfo: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "36px", height: "36px", borderRadius: "50%", background: "#fdf2f8", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" },
  userName: { fontSize: "13px", fontWeight: "600", color: "#1a1a1a", margin: 0, maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  userRole: { fontSize: "11px", color: "#aaa", margin: 0 },
  logoutBtn: { background: "none", border: "1px solid #ececec", borderRadius: "8px", padding: "10px", fontSize: "13px", color: "#888", cursor: "pointer" },
  main: { marginLeft: "240px", flex: 1, padding: "2rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  pageTitle: { fontSize: "24px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px", letterSpacing: "-0.4px" },
  pageSubtitle: { fontSize: "14px", color: "#aaa", margin: 0 },
  primaryBtn: { background: "#FF6B35", color: "white", border: "none", borderRadius: "8px", padding: "9px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  refreshBtn: { background: "white", border: "1px solid #ececec", borderRadius: "8px", padding: "9px 14px", fontSize: "13px", color: "#555", cursor: "pointer" },
  loadingRow: { display: "flex", alignItems: "center", gap: "10px", padding: "2rem 0" },
  spinner: { width: "20px", height: "20px", border: "2px solid #f0f0f0", borderTop: "2px solid #FF6B35", borderRadius: "50%" },
  overviewGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" },
  statusGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "16px" },
  statusCard: { background: "white", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "18px", display: "flex", flexDirection: "column", gap: "8px" },
  statusLabel: { fontSize: "13px", color: "#888", margin: 0 },
  statusValue: { fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: 0 },
  statCard: { background: "white", borderRadius: "14px", border: "1px solid #ececec", padding: "20px", display: "flex", alignItems: "center", gap: "16px" },
  statIcon: { fontSize: "32px" },
  statLabel: { fontSize: "13px", color: "#aaa", margin: "0 0 4px" },
  statValue: { fontSize: "26px", fontWeight: "700", color: "#1a1a1a", margin: 0 },
  tableWrapper: { background: "white", borderRadius: "14px", border: "1px solid #ececec", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#aaa", textAlign: "left", background: "#fafafa", borderBottom: "1px solid #f0f0f0" },
  tr: { borderBottom: "1px solid #f9f9f9" },
  td: { padding: "12px 16px", fontSize: "13px", color: "#333" },
  emptyCell: { padding: "3rem", textAlign: "center", color: "#aaa", fontSize: "14px" },
  nameCell: { display: "flex", alignItems: "center", gap: "10px" },
  tableAvatar: { width: "32px", height: "32px", borderRadius: "50%", background: "#f0f0f0", color: "#555", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "13px", flexShrink: 0 },
  pill: { fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "999px" },
  deleteRowBtn: { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  assignBtn: { background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  
  // Manager-style modal styles
  menuModalOverlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.35)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200, padding: "20px" },
  menuModalContent: { width: "100%", maxWidth: "520px", background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 40px 120px rgba(15, 23, 42, 0.12)" },
  menuModalBody: { padding: "24px" },
  menuModalTitle: { margin: 0, fontSize: "20px", fontWeight: "700", color: "#111827", marginBottom: "18px" },
  menuModalLabel: { display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#374151" },
  menuModalInput: { width: "100%", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "#111827", marginBottom: "14px" },
  menuModalTextarea: { width: "100%", minHeight: "100px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "#111827", marginBottom: "14px", resize: "vertical" },
  menuModalRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" },
  menuModalField: { display: "flex", flexDirection: "column" },
  menuModalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "14px" },
  menuPrimaryBtn: { background: "#FF6B35", color: "white", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", fontWeight: "700" },
  menuSecondaryBtn: { background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", fontWeight: "700" },
};