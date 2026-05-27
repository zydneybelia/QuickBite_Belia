import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8086/api";

const STATUS_OPTIONS = ["PLACED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

export default function ManagerDashboard() {
  const { restaurantId } = useParams();
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [sales, setSales] = useState({ totalSales: 0.0, orderCount: 0, menuItemCount: 0 });
  const [orderStats, setOrderStats] = useState({ totalOrdersCount: 0, placedCount: 0, preparingCount: 0, deliveredCount: 0 });
  const [activeTab, setActiveTab] = useState("orders");
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({ name: "", description: "", price: "", category: "Main", availability: true });
  const [addingMenuItem, setAddingMenuItem] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [user, setUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ firstname: "", lastname: "", email: "", contactNumber: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch {}

    if (!restaurantId) {
      fetchAssignedRestaurant();
      return;
    }

    fetchRestaurantDetails();
    fetchOrders();
    fetchSales();
    fetchOrderStats();
    fetchMenuItems();
  }, [restaurantId]);

  const fetchAssignedRestaurant = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/manager/assigned-restaurant`, authHeaders);
      if (res.data?.restaurantId) {
        navigate(`/manager/restaurant/${res.data.restaurantId}`);
      } else {
        navigate("/manager/waiting");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        navigate("/manager/waiting");
      } else {
        console.error("Failed to fetch assigned restaurant", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/assigned-restaurant`, authHeaders);
      setRestaurant(res.data);
    } catch (err) {
      console.error("Failed to fetch restaurant details", err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/manager/restaurants/${restaurantId}/orders`, authHeaders);
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/restaurants/${restaurantId}/sales`, authHeaders);
      setSales(res.data || { totalSales: 0.0, orderCount: 0, menuItemCount: 0 });
    } catch (err) {
      console.error("Failed to fetch restaurant sales", err);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/restaurants/${restaurantId}/orders/stats`, authHeaders);
      setOrderStats(res.data || { totalOrdersCount: 0, placedCount: 0, preparingCount: 0, deliveredCount: 0 });
    } catch (err) {
      console.error("Failed to fetch order stats", err);
    }
  };

  const fetchMenuItems = async () => {
    setMenuLoading(true);
    try {
      const res = await axios.get(`${API_URL}/manager/restaurants/${restaurantId}/menu`, authHeaders);
      setMenuItems(res.data || []);
    } catch (err) {
      console.error("Failed to fetch menu items", err);
      setMenuItems([]);
    } finally {
      setMenuLoading(false);
    }
  };

  const handleToggleAvailability = async (menuItemId) => {
    try {
      const res = await axios.patch(`${API_URL}/manager/restaurants/${restaurantId}/menu/${menuItemId}/availability`, {}, authHeaders);
      // Update the local state
      setMenuItems(prev => prev.map(item => item.id === menuItemId ? res.data : item));
    } catch (err) {
      console.error("Failed to toggle availability", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to update availability";
      alert(errorMsg);
    }
  };

  const handleAddMenuItem = async () => {
    if (!restaurantId || !newMenuItem.name.trim()) {
      alert("Please enter a menu item name");
      return;
    }
    setAddingMenuItem(true);
    try {
      const response = await axios.post(`${API_URL}/manager/restaurants/${restaurantId}/menu`, {
        name: newMenuItem.name,
        description: newMenuItem.description,
        price: parseFloat(newMenuItem.price),
        category: newMenuItem.category,
        availability: newMenuItem.availability,
      }, authHeaders);
      
      alert("✓ Menu Item Added Successfully!");
      
      setShowAddMenuModal(false);
      setNewMenuItem({ name: "", description: "", price: "", category: "Main", availability: true });
      fetchOrders();
      fetchOrderStats();
      fetchSales();
      fetchMenuItems();
    } catch (err) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.message || err.response?.data || err.message;
      console.error(`[${status}] Failed to add menu item:`, errorMsg);
      
      if (status === 401) {
        alert("Authentication failed. Please log in again.");
      } else if (status === 403) {
        alert("You don't have permission to add items to this restaurant.");
      } else if (status === 400) {
        alert(`Validation error: ${errorMsg}`);
      } else {
        alert("Could not add the menu item. Please verify the fields and try again.");
      }
    } finally {
      setAddingMenuItem(false);
    }
  };

  const closeAddMenuModal = () => {
    setShowAddMenuModal(false);
    setNewMenuItem({ name: "", description: "", price: "", category: "Main", availability: true });
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await axios.put(`${API_URL}/manager/restaurants/${restaurantId}/orders/${orderId}/status`,
        { status: newStatus }, authHeaders);
      // Refetch orders and stats to ensure UI reflects backend state
      await fetchOrders();
      await fetchOrderStats();
      await fetchSales();
    } catch (err) {
      alert("Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOrderDelete = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order record?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/manager/restaurants/${restaurantId}/orders/${orderId}`, authHeaders);
      await fetchOrders();
      await fetchOrderStats();
      await fetchSales();
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
            <div>Restaurant: ${restaurantName}</div>
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

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const getUserIdFromToken = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload?.userId || payload?.sub || payload?.username || null;
    } catch {
      return null;
    }
  };

  const fetchUserProfile = async () => {
    const userId = getUserIdFromToken();
    if (!userId) return;
    setProfileLoading(true);
    try {
      const res = await axios.get(`${API_URL}/users/${userId}`, authHeaders);
      const userProfile = res.data;
      setProfile(userProfile);
      setProfileForm({
        firstname: userProfile.firstname || "",
        lastname: userProfile.lastname || "",
        email: userProfile.email || "",
        contactNumber: userProfile.contactNumber || "",
      });
      // update local user display (sidebar) to show name when available
      setUser((prev) => ({
        ...prev,
        sub: userProfile.firstname ? `${userProfile.firstname} ${userProfile.lastname || ""}` : (userProfile.email || prev?.sub),
      }));
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleOpenProfile = async () => {
    setShowProfileModal(true);
    setIsEditingProfile(false);
    await fetchUserProfile();
  };

  const handleStartEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    if (profile) {
      setProfileForm({
        firstname: profile.firstname || "",
        lastname: profile.lastname || "",
        email: profile.email || "",
        contactNumber: profile.contactNumber || "",
      });
    }
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setProfileSaving(true);
    try {
      const updated = {
        firstname: profileForm.firstname.trim(),
        lastname: profileForm.lastname.trim(),
        email: profileForm.email.trim(),
        contactNumber: profileForm.contactNumber.trim(),
      };
      const res = await axios.put(`${API_URL}/users/${profile.id}`, updated, authHeaders);
      setProfile(res.data);
      // reflect updated name/email in sidebar display
      setUser((prevUser) => ({
        ...prevUser,
        sub: res.data.firstname ? `${res.data.firstname} ${res.data.lastname || ""}` : (res.data.email || prevUser?.sub),
      }));
      // persist display name to localStorage so other dashboards pick it up
      const display = res.data.firstname ? `${res.data.firstname} ${res.data.lastname || ""}`.trim() : (res.data.email || null);
      if (display) localStorage.setItem('displayName', display);
      setIsEditingProfile(false);
      alert("Profile updated successfully.");
    } catch (err) {
      console.error("Failed to save profile", err);
      alert(err.response?.data?.message || "Unable to save profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCloseProfile = () => {
    setShowProfileModal(false);
    setIsEditingProfile(false);
  };

  const getInitials = () => {
    // Prefer profile (most up-to-date), fall back to user.sub
    const source = profile || user;
    if (!source) return "M";
    const first = source.firstname || (typeof source.sub === 'string' ? source.sub.split(' ')[0] : '');
    const last = source.lastname || (typeof source.sub === 'string' ? source.sub.split(' ')[1] : '');
    const a = (first && first.charAt(0)) || (typeof source.sub === 'string' ? source.sub.charAt(0) : 'M');
    const b = (last && last.charAt(0)) || '';
    return (a + b).toUpperCase();
  };

  const filtered = filterStatus === "ALL"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  const countByStatus = (s) => orders.filter((o) => o.status === s).length;

  const statusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "PLACED":    return { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" };
      case "PREPARING": return { bg: "#fef9c3", color: "#ca8a04", border: "#fde68a" };
      case "OUT_FOR_DELIVERY": return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
      case "DELIVERED": return { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
      case "CANCELLED": return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
      default:          return { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
    }
  };

  const restaurantName = restaurant?.name || "Your restaurant";

  return (
    <div style={styles.page}>
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

        <div style={styles.roleTag}>Restaurant Manager</div>

        <nav style={styles.nav}>
          <div
            onClick={() => setActiveTab("orders")}
            style={{
              ...styles.navBtn,
              background: activeTab === "orders" ? "#fff4f0" : "transparent",
              color: activeTab === "orders" ? "#FF6B35" : "#555",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "18px" }}>📦</span>
            <span>Orders</span>
          </div>
          <div
            onClick={() => setActiveTab("menus")}
            style={{
              ...styles.navBtn,
              background: activeTab === "menus" ? "#fff4f0" : "transparent",
              color: activeTab === "menus" ? "#FF6B35" : "#555",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "18px" }}>🍽️</span>
            <span>Menus</span>
          </div>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={{ ...styles.userInfo, cursor: "pointer" }} onClick={handleOpenProfile}>
            <div style={styles.avatar}>
              {getInitials()}
            </div>
            <div>
              <p style={styles.userName}>{profile?.firstname ? `${profile.firstname} ${profile.lastname || ""}` : (user?.sub || "Manager")}</p>
              <p style={styles.userRole}>Restaurant Manager</p>
              <p style={styles.profileLink}>View Profile</p>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>{activeTab === "orders" ? "Order Management" : "Menu Management"}</h1>
            <p style={styles.restaurantName}>{restaurantName}</p>
            <p style={styles.pageSubtitle}>
              {activeTab === "orders"
                ? `${orders.length} total orders`
                : `${menuItems.length} menu items`}
            </p>
          </div>
          <div style={styles.headerActions}>
            {activeTab === "menus" && (
              <button onClick={() => setShowAddMenuModal(true)} style={styles.primaryBtn}>
                + Add Menu Item
              </button>
            )}
            <button
              onClick={() => (activeTab === "orders" ? fetchOrders() : fetchMenuItems())}
              style={styles.refreshBtn}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

      {showAddMenuModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>Add Menu Item</h2>
            <div style={styles.modalBody}>
              <label style={styles.modalLabel}>Name</label>
              <input
                type="text"
                value={newMenuItem.name}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                style={styles.modalInput}
                placeholder="Item name"
              />
              <label style={styles.modalLabel}>Description</label>
              <textarea
                value={newMenuItem.description}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                style={styles.modalTextarea}
                placeholder="Item description"
              />
              <div style={styles.modalRow}>
                <div style={styles.modalField}>
                  <label style={styles.modalLabel}>Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newMenuItem.price}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                    style={styles.modalInput}
                    placeholder="₱0.00"
                  />
                </div>
                <div style={styles.modalField}>
                  <label style={styles.modalLabel}>Category</label>
                  <input
                    type="text"
                    value={newMenuItem.category}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                    style={styles.modalInput}
                    placeholder="Main, Dessert, Drink"
                  />
                </div>
              </div>
              <div style={styles.modalActions}>
                <button onClick={closeAddMenuModal} style={styles.secondaryBtn}>
                  Cancel
                </button>
                <button onClick={handleAddMenuItem} style={styles.primaryBtn} disabled={addingMenuItem}>
                  {addingMenuItem ? "Adding…" : "Save Item"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: "520px" }}>
            <div style={styles.modalBody}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h3 style={styles.modalTitle}>Manager Profile</h3>
                <button onClick={handleCloseProfile} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#aaa" }}>✕</button>
              </div>
              {profileLoading ? (
                <div style={styles.loadingRow}>
                  <div style={styles.spinner} />
                  <span style={{ color: "#aaa", fontSize: "14px" }}>Loading profile...</span>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: "16px" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#aaa", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Name</p>
                    <p style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>
                      {profile?.firstname || ""} {profile?.lastname || ""}
                    </p>
                  </div>

                  <div style={{ display: isEditingProfile ? "none" : "block", gap: "12px" }}>
                    <div style={{ marginBottom: "14px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#aaa", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Email</p>
                      <p style={{ margin: 0, fontSize: "14px", color: "#334155" }}>{profile?.email || "—"}</p>
                    </div>
                    <div style={{ marginBottom: "14px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#aaa", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Contact Number</p>
                      <p style={{ margin: 0, fontSize: "14px", color: "#334155" }}>{profile?.contactNumber || "—"}</p>
                    </div>
                  </div>

                  {isEditingProfile && (
                    <>
                      <div style={styles.modalRow}>
                        <div style={styles.modalField}>
                          <label style={styles.modalLabel}>First Name</label>
                          <input
                            type="text"
                            value={profileForm.firstname}
                            onChange={(e) => setProfileForm({ ...profileForm, firstname: e.target.value })}
                            style={styles.modalInput}
                            placeholder="First name"
                          />
                        </div>
                        <div style={styles.modalField}>
                          <label style={styles.modalLabel}>Last Name</label>
                          <input
                            type="text"
                            value={profileForm.lastname}
                            onChange={(e) => setProfileForm({ ...profileForm, lastname: e.target.value })}
                            style={styles.modalInput}
                            placeholder="Last name"
                          />
                        </div>
                      </div>
                      <div style={styles.modalField}>
                        <label style={styles.modalLabel}>Email</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          style={styles.modalInput}
                          placeholder="name@example.com"
                        />
                      </div>
                      <div style={styles.modalField}>
                        <label style={styles.modalLabel}>Contact Number</label>
                        <input
                          type="text"
                          value={profileForm.contactNumber}
                          onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                          style={styles.modalInput}
                          placeholder="09XXXXXXXXX"
                        />
                      </div>
                    </>
                  )}

                  <div style={{ ...styles.modalActions, marginTop: "20px", justifyContent: "flex-end" }}>
                    {isEditingProfile ? (
                      <>
                        <button onClick={handleCancelEditProfile} style={styles.secondaryBtn}>Cancel</button>
                        <button onClick={handleSaveProfile} disabled={profileSaving} style={styles.primaryBtn}>
                          {profileSaving ? "Saving…" : "Save Changes"}
                        </button>
                      </>
                    ) : (
                      <button onClick={handleStartEditProfile} style={styles.primaryBtn}>Edit Profile</button>
                    )}
                    <button onClick={handleCloseProfile} style={styles.secondaryBtn}>Close</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <>
          <div style={styles.statsGrid}>
            {[
              { label: "Revenue", value: `₱${sales.totalSales.toFixed(2)}`, color: "#16a34a" },
              { label: "Total Orders", value: orderStats.totalOrdersCount, color: "#1f2937" },
              { label: "Placed", value: orderStats.placedCount, color: "#ea580c" },
              { label: "Preparing", value: orderStats.preparingCount, color: "#ca8a04" },
              { label: "Out for Delivery", value: orderStats.outForDeliveryCount, color: "#2563eb" },
              { label: "Delivered", value: orderStats.deliveredCount, color: "#16a34a" },
            ].map((stat) => (
              <div key={stat.label} style={styles.statsCard}>
                <span style={styles.statsLabel}>{stat.label}</span>
                <span style={{ ...styles.statsValue, color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>


        {loading ? (
          <div style={styles.loadingRow}>
            <div style={styles.spinner} />
            <span style={{ color: "#aaa", fontSize: "14px" }}>Loading orders...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: "48px" }}>📦</span>
            <p>No orders found.</p>
          </div>
        ) : (
          <div style={styles.ordersList}>
            {filtered.map((order) => {
              const sc = statusColor(order.status);
              return (
                <div key={order.id} style={styles.orderCard}>
                  <div style={styles.orderLeft}>
                    <div style={styles.orderIdRow}>
                      <span style={styles.orderId}>
                        #{order.id?.slice(0, 8).toUpperCase()}
                      </span>
                      <span style={{
                        ...styles.statusPill,
                        background: sc.bg,
                        color: sc.color,
                        border: `1px solid ${sc.border}`,
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <p style={styles.orderMeta}>
                      📅 {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-PH", {
                            year: "numeric", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : "—"}
                    </p>
                    <p style={styles.orderAmount}>
                      Total: <strong style={{ color: "#FF6B35" }}>
                        ₱{order.totalAmount?.toFixed(2)}
                      </strong>
                    </p>
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      <button
                        onClick={() => handleViewOrder(order)}
                        style={{ ...styles.actionBtn, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}
                      >
                        👁️ View
                      </button>
                      {order.status?.toUpperCase() === "DELIVERED" && (
                        <button
                          onClick={() => handlePrintReceipt(order)}
                          style={{ ...styles.actionBtn, background: "#fff4f0", color: "#FF6B35", border: "1px solid #ffccbc" }}
                        >
                          🖨️ Receipt
                        </button>
                      )}
                      <button
                        onClick={() => handleOrderDelete(order.id)}
                        style={{ ...styles.actionBtn, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Status updater */}
                  <div style={styles.orderRight}>
                    <p style={styles.updateLabel}>Update Status</p>
                    <div style={styles.statusBtns}>
                      {(() => {
                        const currentIndex = STATUS_OPTIONS.indexOf(order.status);
                        const nextStatuses = STATUS_OPTIONS.slice(currentIndex);
                        return nextStatuses.map((s) => {
                          const sc2 = statusColor(s);
                          const isActive = order.status === s;
                          return (
                            <button
                              key={s}
                              onClick={() => !isActive && handleStatusUpdate(order.id, s)}
                              disabled={isActive || updatingId === order.id}
                              style={{
                                ...styles.statusBtn,
                                background: isActive ? sc2.bg : "white",
                                color: isActive ? sc2.color : "#aaa",
                                border: `1px solid ${isActive ? sc2.border : "#ececec"}`,
                                fontWeight: isActive ? "700" : "400",
                                cursor: isActive ? "default" : "pointer",
                              }}
                            >
                              {updatingId === order.id && !isActive ? "..." : s}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
      )}

      {activeTab === "menus" && (
        <>
          {menuLoading ? (
            <div style={styles.loadingRow}>
              <div style={styles.spinner} />
              <span style={{ color: "#aaa", fontSize: "14px" }}>Loading menus...</span>
            </div>
          ) : menuItems.length === 0 ? (
            <div style={styles.empty}>
              <span style={{ fontSize: "48px" }}>🍽️</span>
              <p>No menu items available yet.</p>
            </div>
          ) : (
            <div style={styles.menuList}>
              {menuItems.map((item) => (
                <div key={item.id} style={{
                  ...styles.menuCard,
                  opacity: item.availability ? 1 : 0.7,
                  background: item.availability ? "white" : "#f9fafb",
                  borderColor: item.availability ? "#ececec" : "#e5e7eb"
                }}>
                  <div style={{ opacity: item.availability ? 1 : 0.6 }}>
                    <div style={styles.menuCategory}>{item.category || "Menu Item"}</div>
                    <h3 style={styles.menuName}>{item.name || "Untitled Item"}</h3>
                    <p style={styles.menuDescription}>{item.description || "No description provided."}</p>
                  </div>
                  <div style={styles.menuFooter}>
                    <span style={{ ...styles.menuPrice, opacity: item.availability ? 1 : 0.6 }}>
                      ₱{item.price?.toFixed?.(2) ?? item.price ?? "0.00"}
                    </span>
                    <button
                      onClick={() => handleToggleAvailability(item.id)}
                      style={{
                        ...styles.availabilityBtn,
                        background: item.availability ? "#f0fdf4" : "#fef2f2",
                        color: item.availability ? "#16a34a" : "#dc2626",
                        borderColor: item.availability ? "#bbf7d0" : "#fecaca",
                        fontWeight: "700"
                      }}
                    >
                      {item.availability ? "● Available" : "○ Unavailable"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* View Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: "500px" }}>
            <div style={{ ...styles.modalBody, padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h3 style={styles.modalTitle}>Order Details</h3>
                <button onClick={() => setShowOrderDetails(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#aaa" }}>✕</button>
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#aaa", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Customer</p>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#111827" }}>👤 {selectedOrder.customerName}</p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#aaa", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Items</p>
                <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", border: "1px solid #f1f5f9" }}>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <span style={{ background: "#FF6B35", color: "white", padding: "2px 7px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>x{item.quantity}</span>
                        <span style={{ fontWeight: "500", color: "#334155" }}>{item.menuItemName}</span>
                      </div>
                      <span style={{ fontWeight: "600", color: "#475569" }}>₱{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: "6px", paddingTop: "10px", borderTop: "1px dashed #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Total Payment</span>
                    <span style={{ fontSize: "18px", fontWeight: "800", color: "#FF6B35" }}>₱{selectedOrder.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#aaa", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Payment Method</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                    {selectedOrder.paymentMethod === "cash_on_delivery" ? "💵 Cash" : 
                     selectedOrder.paymentMethod === "gcash" ? "📱 GCash" : 
                     selectedOrder.paymentMethod === "maya" ? "💳 Maya" : selectedOrder.paymentMethod}
                  </p>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#aaa", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Order Status</p>
                  <span style={{ 
                    ...styles.statusPill, 
                    background: statusColor(selectedOrder.status).bg, 
                    color: statusColor(selectedOrder.status).color,
                    border: `1px solid ${statusColor(selectedOrder.status).border}`
                  }}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div>
                <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#aaa", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Delivery Address</p>
                <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>📍 {selectedOrder.deliveryAddress}</p>
              </div>

              <div style={{ ...styles.modalActions, marginTop: "24px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                {selectedOrder.status?.toUpperCase() === "PLACED" && (
                  <>
                    <button 
                      onClick={async () => {
                        await handleStatusUpdate(selectedOrder.id, "PREPARING");
                        setShowOrderDetails(false);
                      }} 
                      style={{ ...styles.primaryBtn, background: "#16a34a", borderColor: "#16a34a" }}
                    >
                      Approve
                    </button>
                    <button 
                      onClick={async () => {
                        await handleStatusUpdate(selectedOrder.id, "CANCELLED");
                        setShowOrderDetails(false);
                      }} 
                      style={{ ...styles.primaryBtn, background: "#ef4444", borderColor: "#ef4444" }}
                    >
                      Cancel Order
                    </button>
                  </>
                )}
                {selectedOrder.status?.toUpperCase() === "PREPARING" && (
                  <button 
                    onClick={async () => {
                      await handleStatusUpdate(selectedOrder.id, "OUT_FOR_DELIVERY");
                      setShowOrderDetails(false);
                    }} 
                    style={{ ...styles.primaryBtn, background: "#2563eb", borderColor: "#2563eb" }}
                  >
                    Mark as Ready
                  </button>
                )}
                {selectedOrder.status?.toUpperCase() === "OUT_FOR_DELIVERY" && (
                  <button 
                    onClick={async () => {
                      await handleStatusUpdate(selectedOrder.id, "DELIVERED");
                      setShowOrderDetails(false);
                    }} 
                    style={{ ...styles.primaryBtn, background: "#16a34a", borderColor: "#16a34a" }}
                  >
                    Mark as Delivered
                  </button>
                )}
                {selectedOrder.status?.toUpperCase() === "DELIVERED" && (
                  <button 
                    onClick={() => handlePrintReceipt(selectedOrder)} 
                    style={{ ...styles.primaryBtn, background: "#FF6B35", borderColor: "#FF6B35" }}
                  >
                    🖨️ Print Receipt
                  </button>
                )}
                <button onClick={() => setShowOrderDetails(false)} style={styles.primaryBtn}>Close</button>
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
  sidebar: { width: "240px", minHeight: "100vh", background: "#ffffff", borderRight: "1px solid #ececec", display: "flex", flexDirection: "column", padding: "1.5rem 1rem", position: "fixed", top: 0, left: 0, bottom: 0 },
  logoRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem", paddingLeft: "4px" },
  logoIcon: { width: "36px", height: "36px", borderRadius: "10px", background: "#FF6B35", display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: "17px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-0.3px" },
  roleTag: { fontSize: "11px", fontWeight: "600", color: "#FF6B35", background: "#fff4f0", borderRadius: "6px", padding: "4px 10px", marginBottom: "1.25rem", display: "inline-block" },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navBtn: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", fontSize: "14px", fontWeight: "600", transition: "all 0.15s" },
  statCards: { display: "flex", flexDirection: "column", gap: "8px", margin: "1rem 0" },
  statCard: { borderRadius: "10px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  sidebarFooter: {
    borderTop: "1px solid #f0f0f0",
    paddingTop: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "auto",
    paddingBottom: "1rem",
  },
  userInfo: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "36px", height: "36px", borderRadius: "50%", background: "#fff4f0", color: "#FF6B35", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" },
  userName: { fontSize: "13px", fontWeight: "600", color: "#1a1a1a", margin: 0, maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  userRole: { fontSize: "11px", color: "#aaa", margin: 0 },
  profileLink: { fontSize: "11px", color: "#FF6B35", margin: "4px 0 0", fontWeight: "700" },
  logoutBtn: { background: "none", border: "1px solid #ececec", borderRadius: "8px", padding: "8px", fontSize: "13px", color: "#888", cursor: "pointer" },
  main: { marginLeft: "240px", flex: 1, padding: "2rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  pageTitle: { fontSize: "24px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px", letterSpacing: "-0.4px" },
  restaurantName: { fontSize: "16px", color: "#555", margin: "0 0 8px", fontWeight: "600" },
  pageSubtitle: { fontSize: "14px", color: "#aaa", margin: 0 },
  refreshBtn: { background: "white", border: "1px solid #ececec", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", color: "#555", cursor: "pointer" },
  filterRow: { display: "flex", gap: "8px", marginBottom: "1.25rem", flexWrap: "wrap" },
  filterBtn: { padding: "7px 14px", borderRadius: "8px", border: "1px solid", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s" },
  menuList: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" },
  menuCard: { background: "white", borderRadius: "16px", border: "1px solid #ececec", padding: "18px", minHeight: "180px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "14px" },
  menuCategory: { fontSize: "11px", fontWeight: "700", color: "#FF6B35", textTransform: "uppercase", letterSpacing: "0.12em" },
  menuName: { fontSize: "18px", fontWeight: "700", margin: "0 0 6px" },
  menuDescription: { fontSize: "13px", color: "#4b5563", lineHeight: "1.6", margin: 0 },
  menuFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginTop: "12px" },
  menuPrice: { fontSize: "16px", fontWeight: "700", color: "#111827" },
  availabilityBtn: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    border: "1px solid",
    transition: "all 0.2s",
    outline: "none",
  },
  loadingRow: { display: "flex", alignItems: "center", gap: "10px", padding: "2rem 0" },
  spinner: { width: "20px", height: "20px", border: "2px solid #f0f0f0", borderTop: "2px solid #FF6B35", borderRadius: "50%" },
  empty: { textAlign: "center", padding: "4rem 2rem", color: "#aaa", fontSize: "15px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  ordersList: { display: "flex", flexDirection: "column", gap: "12px" },
  orderCard: { background: "white", borderRadius: "14px", border: "1px solid #ececec", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" },
  orderLeft: { flex: 1 },
  orderIdRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" },
  orderId: { fontSize: "15px", fontWeight: "700", color: "#1a1a1a" },
  statusPill: { fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "999px" },
  orderMeta: { fontSize: "12px", color: "#aaa", margin: "0 0 4px" },
  orderAmount: { fontSize: "14px", color: "#555", margin: 0 },
  orderRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" },
  updateLabel: { fontSize: "11px", color: "#aaa", margin: 0, fontWeight: "600" },
  statusBtns: { display: "flex", gap: "6px" },
  statusBtn: { padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "500", transition: "all 0.15s" },
  actionBtn: {
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  headerActions: { display: "flex", gap: "10px", alignItems: "center" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" },
  statsCard: { background: "white", borderRadius: "16px", padding: "18px 20px", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)", minHeight: "110px", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  statsLabel: { fontSize: "13px", color: "#6b7280", marginBottom: "10px" },
  statsValue: { fontSize: "28px", fontWeight: "700" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.35)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50, padding: "20px" },
  modalContent: { width: "100%", maxWidth: "520px", background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 40px 120px rgba(15, 23, 42, 0.12)" },
  modalBody: { padding: "24px" },
  modalTitle: { margin: 0, fontSize: "20px", fontWeight: "700", color: "#111827", marginBottom: "18px" },
  modalLabel: { display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#374151" },
  modalInput: { width: "100%", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "#111827", marginBottom: "14px" },
  modalTextarea: { width: "100%", minHeight: "100px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "#111827", marginBottom: "14px", resize: "vertical" },
  modalRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" },
  modalField: { display: "flex", flexDirection: "column" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "14px" },
  primaryBtn: { background: "#FF6B35", color: "white", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", fontWeight: "700" },
  secondaryBtn: { background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", fontWeight: "700" },
};