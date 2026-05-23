import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8086/api";

const STATUS_OPTIONS = ["PLACED", "PREPARING", "DELIVERED"];

export default function ManagerDashboard() {
  const { restaurantId } = useParams();
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [sales, setSales] = useState({ totalSales: 0.0, orderCount: 0, menuItemCount: 0 });
  const [orderStats, setOrderStats] = useState({ totalOrdersCount: 0, placedCount: 0, preparingCount: 0, deliveredCount: 0 });
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({ name: "", description: "", price: "", category: "Main", availability: true });
  const [addingMenuItem, setAddingMenuItem] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
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

    if (!restaurantId) {
      fetchAssignedRestaurant();
      return;
    }

    fetchRestaurantDetails();
    fetchOrders();
    fetchSales();
    fetchOrderStats();
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
      
      // ✅ SUCCESS FEEDBACK
      alert("✓ Menu Item Added Successfully!");
      
      setShowAddMenuModal(false);
      setNewMenuItem({ name: "", description: "", price: "", category: "Main", availability: true });
      fetchOrders();
      fetchOrderStats();
      fetchSales();
    } catch (err) {
      // ✅ DETAILED ERROR LOGGING
      const status = err.response?.status;
      const errorMsg = err.response?.data?.message || err.response?.data || err.message;
      console.error(`[${status}] Failed to add menu item:`, errorMsg);
      
      // Provide user-friendly error messages
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
      setOrders(orders.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
    } catch (err) {
      alert("Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const filtered = filterStatus === "ALL"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  const countByStatus = (s) => orders.filter((o) => o.status === s).length;

  const statusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "PLACED":    return { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" };
      case "PREPARING": return { bg: "#fef9c3", color: "#ca8a04", border: "#fde68a" };
      case "DELIVERED": return { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
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
          <div style={styles.navBtn}>
            <span style={{ fontSize: "18px" }}>📦</span>
            <span>Orders</span>
          </div>
        </nav>

        {/* Stats */}
        <div style={styles.statCards}>
          {[
            { label: "Placed", value: countByStatus("PLACED"), color: "#ea580c", bg: "#fff7ed" },
            { label: "Preparing", value: countByStatus("PREPARING"), color: "#ca8a04", bg: "#fef9c3" },
            { label: "Delivered", value: countByStatus("DELIVERED"), color: "#16a34a", bg: "#f0fdf4" },
          ].map((s) => (
            <div key={s.label} style={{ ...styles.statCard, background: s.bg }}>
              <span style={{ fontSize: "20px", fontWeight: "700", color: s.color }}>{s.value}</span>
              <span style={{ fontSize: "11px", color: s.color }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {user?.sub?.charAt(0)?.toUpperCase() || "M"}
            </div>
            <div>
              <p style={styles.userName}>{user?.sub || "Manager"}</p>
              <p style={styles.userRole}>Manager</p>
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
            <h1 style={styles.pageTitle}>Order Management</h1>
            <p style={styles.restaurantName}>{restaurantName}</p>
            <p style={styles.pageSubtitle}>{orders.length} total orders</p>
          </div>
          <div style={styles.headerActions}>
            <button onClick={() => setShowAddMenuModal(true)} style={styles.primaryBtn}>
              + Add Menu Item
            </button>
            <button onClick={fetchOrders} style={styles.refreshBtn}>
              ↻ Refresh
            </button>
          </div>
        </div>

        <div style={styles.statsGrid}>
          {[
            { label: "Total Orders", value: orderStats.totalOrdersCount, color: "#1f2937" },
            { label: "Placed", value: orderStats.placedCount, color: "#ea580c" },
            { label: "Preparing", value: orderStats.preparingCount, color: "#ca8a04" },
            { label: "Delivered", value: orderStats.deliveredCount, color: "#16a34a" },
          ].map((stat) => (
            <div key={stat.label} style={styles.statsCard}>
              <span style={styles.statsLabel}>{stat.label}</span>
              <span style={{ ...styles.statsValue, color: stat.color }}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={styles.filterRow}>
          {["ALL", ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                ...styles.filterBtn,
                background: filterStatus === s ? "#FF6B35" : "white",
                color: filterStatus === s ? "white" : "#555",
                borderColor: filterStatus === s ? "#FF6B35" : "#ececec",
              }}
            >
              {s} {s !== "ALL" && `(${countByStatus(s)})`}
            </button>
          ))}
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
                  </div>

                  {/* Status updater */}
                  <div style={styles.orderRight}>
                    <p style={styles.updateLabel}>Update Status</p>
                    <div style={styles.statusBtns}>
                      {STATUS_OPTIONS.map((s) => {
                        const sc2 = statusColor(s);
                        const isActive = order.status === s;
                        return (
                          <button
                            key={s}
                            onClick={() => handleStatusUpdate(order.id, s)}
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
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
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
  navBtn: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "#fff4f0", color: "#FF6B35", fontWeight: "600", fontSize: "14px" },
  statCards: { display: "flex", flexDirection: "column", gap: "8px", margin: "1rem 0" },
  statCard: { borderRadius: "10px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  sidebarFooter: {
    borderTop: "1px solid #f0f0f0",
    paddingTop: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "auto",        // ✅ pushes footer to bottom
    paddingBottom: "1rem",    // ✅ adds space at bottom
  },
  userInfo: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "36px", height: "36px", borderRadius: "50%", background: "#fff4f0", color: "#FF6B35", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" },
  userName: { fontSize: "13px", fontWeight: "600", color: "#1a1a1a", margin: 0, maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  userRole: { fontSize: "11px", color: "#aaa", margin: 0 },
  logoutBtn: { background: "none", border: "1px solid #ececec", borderRadius: "8px", padding: "8px", fontSize: "13px", color: "#888", cursor: "pointer" },
  main: { marginLeft: "240px", flex: 1, padding: "2rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  pageTitle: { fontSize: "24px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px", letterSpacing: "-0.4px" },
  restaurantName: { fontSize: "16px", color: "#555", margin: "0 0 8px", fontWeight: "600" },
  pageSubtitle: { fontSize: "14px", color: "#aaa", margin: 0 },
  refreshBtn: { background: "white", border: "1px solid #ececec", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", color: "#555", cursor: "pointer" },
  filterRow: { display: "flex", gap: "8px", marginBottom: "1.25rem", flexWrap: "wrap" },
  filterBtn: { padding: "7px 14px", borderRadius: "8px", border: "1px solid", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s" },
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
  headerActions: { display: "flex", gap: "10px", alignItems: "center" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px", marginBottom: "24px" },
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