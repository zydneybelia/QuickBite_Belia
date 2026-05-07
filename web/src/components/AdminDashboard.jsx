import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8080/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch {}
    fetchAll();
  }, []);

  const fetchAll = () => {
    fetchUsers();
    fetchRestaurants();
    fetchOrders();
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/users`, authHeaders);
      setUsers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchRestaurants = async () => {
    try {
      const res = await axios.get(`${API_URL}/restaurants`, authHeaders);
      setRestaurants(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders`, authHeaders);
      setOrders(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`${API_URL}/users/${id}`, authHeaders);
      setUsers(users.filter((u) => u.id !== id));
      setConfirmDelete(null);
    } catch { alert("Failed to delete user"); }
  };

  const handleDeleteRestaurant = async (id) => {
    try {
      await axios.delete(`${API_URL}/restaurants/${id}`, authHeaders);
      setRestaurants(restaurants.filter((r) => r.id !== id));
      setConfirmDelete(null);
    } catch { alert("Failed to delete restaurant"); }
  };

  const handleDeleteOrder = async (id) => {
    try {
      await axios.delete(`${API_URL}/orders/${id}`, authHeaders);
      setOrders(orders.filter((o) => o.id !== id));
      setConfirmDelete(null);
    } catch { alert("Failed to delete order"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const statusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "PLACED":    return { bg: "#fff7ed", color: "#ea580c" };
      case "PREPARING": return { bg: "#fef9c3", color: "#ca8a04" };
      case "DELIVERED": return { bg: "#f0fdf4", color: "#16a34a" };
      default:          return { bg: "#f3f4f6", color: "#6b7280" };
    }
  };

  const roleColor = (role) => {
    switch (role) {
      case "ADMIN":               return { bg: "#fdf2f8", color: "#9333ea" };
      case "RESTAURANT_MANAGER":  return { bg: "#eff6ff", color: "#2563eb" };
      default:                    return { bg: "#f0fdf4", color: "#16a34a" };
    }
  };

  const tabs = [
    { key: "users",       label: "Users",       icon: "👤", count: users.length },
    { key: "restaurants", label: "Restaurants", icon: "🏪", count: restaurants.length },
    { key: "orders",      label: "Orders",      icon: "📦", count: orders.length },
  ];

  return (
    <div style={styles.page}>
      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Confirm Delete</h3>
            <p style={styles.modalText}>
              Are you sure you want to delete this {confirmDelete.type}? This action cannot be undone.
            </p>
            <div style={styles.modalBtns}>
              <button onClick={() => setConfirmDelete(null)} style={styles.cancelBtn}>Cancel</button>
              <button
                onClick={() => {
                  if (confirmDelete.type === "user") handleDeleteUser(confirmDelete.id);
                  else if (confirmDelete.type === "restaurant") handleDeleteRestaurant(confirmDelete.id);
                  else if (confirmDelete.type === "order") handleDeleteOrder(confirmDelete.id);
                }}
                style={styles.deleteBtn}
              >
                Delete
              </button>
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

        <div style={styles.roleTag}>Admin</div>

        <nav style={styles.nav}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                ...styles.navBtn,
                background: activeTab === t.key ? "#fff4f0" : "transparent",
                color: activeTab === t.key ? "#FF6B35" : "#555",
                fontWeight: activeTab === t.key ? "600" : "400",
              }}
            >
              <span style={{ fontSize: "18px" }}>{t.icon}</span>
              <span style={{ flex: 1 }}>{t.label}</span>
              <span style={{
                ...styles.countBadge,
                background: activeTab === t.key ? "#FF6B35" : "#f0f0f0",
                color: activeTab === t.key ? "white" : "#888",
              }}>
                {t.count}
              </span>
            </button>
          ))}
        </nav>

        {/* Overview stats */}
        <div style={styles.overviewCards}>
          {[
            { label: "Total Users", value: users.length, color: "#9333ea", bg: "#fdf2f8" },
            { label: "Restaurants", value: restaurants.length, color: "#2563eb", bg: "#eff6ff" },
            { label: "Orders", value: orders.length, color: "#FF6B35", bg: "#fff4f0" },
          ].map((s) => (
            <div key={s.label} style={{ ...styles.overviewCard, background: s.bg }}>
              <span style={{ fontSize: "18px", fontWeight: "700", color: s.color }}>{s.value}</span>
              <span style={{ fontSize: "10px", color: s.color, fontWeight: "600" }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {user?.sub?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div>
              <p style={styles.userName}>{user?.sub || "Admin"}</p>
              <p style={styles.userRole}>Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              {activeTab === "users" && "Manage Users"}
              {activeTab === "restaurants" && "Manage Restaurants"}
              {activeTab === "orders" && "Manage Orders"}
            </h1>
            <p style={styles.pageSubtitle}>
              {activeTab === "users" && `${users.length} registered users`}
              {activeTab === "restaurants" && `${restaurants.length} restaurants`}
              {activeTab === "orders" && `${orders.length} total orders`}
            </p>
          </div>
          <button onClick={fetchAll} style={styles.refreshBtn}>↻ Refresh</button>
        </div>

        {loading && (
          <div style={styles.loadingRow}>
            <div style={styles.spinner} />
            <span style={{ color: "#aaa", fontSize: "14px" }}>Loading...</span>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && !loading && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Name", "Email", "Role", "Created At", "Action"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={5} style={styles.emptyCell}>No users found.</td></tr>
                ) : users.map((u) => {
                  const rc = roleColor(u.role);
                  return (
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <div style={styles.tableAvatar}>
                            {u.firstname?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <span>{u.firstname} {u.lastname}</span>
                        </div>
                      </td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.rolePill, background: rc.bg, color: rc.color }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
                          : "—"}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => setConfirmDelete({ id: u.id, type: "user" })}
                          style={styles.deleteRowBtn}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Restaurants Tab */}
        {activeTab === "restaurants" && !loading && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Name", "Location", "Status", "Owner", "Action"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {restaurants.length === 0 ? (
                  <tr><td colSpan={5} style={styles.emptyCell}>No restaurants found.</td></tr>
                ) : restaurants.map((r) => (
                  <tr key={r.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        <div style={{ ...styles.tableAvatar, background: "#fff4f0", color: "#FF6B35" }}>
                          🏪
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: "600", fontSize: "14px" }}>{r.name}</p>
                          <p style={{ margin: 0, fontSize: "11px", color: "#aaa" }}>{r.description}</p>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{r.location || "—"}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.rolePill,
                        background: r.status === "active" ? "#f0fdf4" : "#fef2f2",
                        color: r.status === "active" ? "#16a34a" : "#dc2626",
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={styles.td}>{r.owner?.email || r.owner?.firstname || "—"}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => setConfirmDelete({ id: r.id, type: "restaurant" })}
                        style={styles.deleteRowBtn}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && !loading && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Order ID", "Customer", "Total", "Status", "Date", "Action"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={6} style={styles.emptyCell}>No orders found.</td></tr>
                ) : orders.map((o) => {
                  const sc = statusColor(o.status);
                  return (
                    <tr key={o.id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.orderId}>#{o.id?.slice(0, 8).toUpperCase()}</span>
                      </td>
                      <td style={styles.td}>{o.user?.email || o.user?.firstname || "—"}</td>
                      <td style={styles.td}>
                        <strong style={{ color: "#FF6B35" }}>₱{o.totalAmount?.toFixed(2)}</strong>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.rolePill, background: sc.bg, color: sc.color }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
                          : "—"}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => setConfirmDelete({ id: o.id, type: "order" })}
                          style={styles.deleteRowBtn}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { display: "flex", minHeight: "100vh", background: "#f7f5f2", fontFamily: "'Segoe UI', sans-serif" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "white", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "380px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  modalTitle: { fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px" },
  modalText: { fontSize: "14px", color: "#888", margin: "0 0 1.5rem", lineHeight: "1.6" },
  modalBtns: { display: "flex", gap: "10px", justifyContent: "flex-end" },
  cancelBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ececec", background: "white", fontSize: "14px", cursor: "pointer", color: "#555" },
  deleteBtn: { padding: "8px 16px", borderRadius: "8px", border: "none", background: "#ef4444", color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  sidebar: { width: "240px", minHeight: "100vh", background: "#ffffff", borderRight: "1px solid #ececec", display: "flex", flexDirection: "column", padding: "1.5rem 1rem", position: "fixed", top: 0, left: 0, bottom: 0 },
  logoRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem", paddingLeft: "4px" },
  logoIcon: { width: "36px", height: "36px", borderRadius: "10px", background: "#FF6B35", display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: "17px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-0.3px" },
  roleTag: { fontSize: "11px", fontWeight: "600", color: "#9333ea", background: "#fdf2f8", borderRadius: "6px", padding: "4px 10px", marginBottom: "1.25rem", display: "inline-block" },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navBtn: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", textAlign: "left", transition: "background 0.15s" },
  countBadge: { fontSize: "11px", fontWeight: "700", padding: "2px 7px", borderRadius: "999px" },
  overviewCards: { display: "flex", flexDirection: "column", gap: "8px", margin: "1rem 0" },
  overviewCard: { borderRadius: "10px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" },
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
  avatar: { width: "36px", height: "36px", borderRadius: "50%", background: "#fdf2f8", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" },
  userName: { fontSize: "13px", fontWeight: "600", color: "#1a1a1a", margin: 0, maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  userRole: { fontSize: "11px", color: "#aaa", margin: 0 },
  logoutBtn: { background: "none", border: "1px solid #ececec", borderRadius: "8px", padding: "8px", fontSize: "13px", color: "#888", cursor: "pointer" },
  main: { marginLeft: "240px", flex: 1, padding: "2rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  pageTitle: { fontSize: "24px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px", letterSpacing: "-0.4px" },
  pageSubtitle: { fontSize: "14px", color: "#aaa", margin: 0 },
  refreshBtn: { background: "white", border: "1px solid #ececec", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", color: "#555", cursor: "pointer" },
  loadingRow: { display: "flex", alignItems: "center", gap: "10px", padding: "2rem 0" },
  spinner: { width: "20px", height: "20px", border: "2px solid #f0f0f0", borderTop: "2px solid #FF6B35", borderRadius: "50%" },
  tableWrapper: { background: "white", borderRadius: "14px", border: "1px solid #ececec", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#aaa", textAlign: "left", background: "#fafafa", borderBottom: "1px solid #f0f0f0" },
  tr: { borderBottom: "1px solid #f9f9f9" },
  td: { padding: "12px 16px", fontSize: "13px", color: "#333" },
  emptyCell: { padding: "3rem", textAlign: "center", color: "#aaa", fontSize: "14px" },
  nameCell: { display: "flex", alignItems: "center", gap: "10px" },
  tableAvatar: { width: "32px", height: "32px", borderRadius: "50%", background: "#f0f0f0", color: "#555", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "13px", flexShrink: 0 },
  rolePill: { fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "999px" },
  orderId: { fontSize: "13px", fontWeight: "700", color: "#1a1a1a", fontFamily: "monospace" },
  deleteRowBtn: { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
};