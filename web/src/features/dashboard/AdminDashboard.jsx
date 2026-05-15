import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8083/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [managers, setManagers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Modals
  const [showCreateRestaurant, setShowCreateRestaurant] = useState(false);
  const [showCreateManager, setShowCreateManager] = useState(false);
  const [showAssignManager, setShowAssignManager] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Forms
  const [restaurantForm, setRestaurantForm] = useState({ name: "", description: "", location: "", status: "active" });
  const [managerForm, setManagerForm] = useState({ firstname: "", lastname: "", email: "", password: "" });
  const [assignManagerId, setAssignManagerId] = useState("");
  const [formLoading, setFormLoading] = useState(false);

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

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await axios.post(`${API_URL}/admin/restaurants`, restaurantForm, authHeaders);
      setRestaurants([...restaurants, res.data]);
      setShowCreateRestaurant(false);
      setRestaurantForm({ name: "", description: "", location: "", status: "active" });
      alert("Restaurant created successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create restaurant");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await axios.post(`${API_URL}/admin/managers`, managerForm, authHeaders);
      setManagers([...managers, res.data]);
      setShowCreateManager(false);
      setManagerForm({ firstname: "", lastname: "", email: "", password: "" });
      alert("Manager created successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create manager");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignManager = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant || !assignManagerId) return;
    setFormLoading(true);
    try {
      const res = await axios.put(
        `${API_URL}/admin/restaurants/${selectedRestaurant.id}/assign/${assignManagerId}`,
        {}, authHeaders
      );
      setRestaurants(restaurants.map((r) => r.id === res.data.id ? res.data : r));
      setShowAssignManager(false);
      setAssignManagerId("");
      setSelectedRestaurant(null);
      alert("Manager assigned successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign manager");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`${API_URL}/users/${id}`, authHeaders);
      setUsers(users.filter((u) => u.id !== id));
      setConfirmDelete(null);
    } catch { alert("Failed to delete user"); }
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

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const userStats = {
    total: users.length,
    customers: users.filter((u) => u.role === "CUSTOMER").length,
    managers: managers.length,
  };

  const inputStyle = {
    height: "40px", padding: "0 12px", borderRadius: "8px",
    border: "1.5px solid #e0e0e0", fontSize: "14px", color: "#1a1a1a",
    background: "#fafafa", outline: "none", width: "100%", boxSizing: "border-box",
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
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={styles.fieldGroup}>
                  <label style={styles.label}>{label}</label>
                  <input
                    value={restaurantForm[key]}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    required
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

      {/* Create Manager Modal */}
      {showCreateManager && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Create Manager Account</h3>
            <form onSubmit={handleCreateManager} style={styles.form}>
              <div style={styles.twoCol}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>First Name</label>
                  <input value={managerForm.firstname} onChange={(e) => setManagerForm({ ...managerForm, firstname: e.target.value })} placeholder="John" required style={inputStyle} />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Last Name</label>
                  <input value={managerForm.lastname} onChange={(e) => setManagerForm({ ...managerForm, lastname: e.target.value })} placeholder="Doe" required style={inputStyle} />
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email</label>
                <input type="email" value={managerForm.email} onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })} placeholder="manager@example.com" required style={inputStyle} />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Password</label>
                <input type="password" value={managerForm.password} onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })} placeholder="Min. 6 characters" required minLength={6} style={inputStyle} />
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

      {/* Assign Manager Modal */}
      {showAssignManager && selectedRestaurant && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Assign Manager</h3>
            <p style={styles.modalText}>Assigning manager to: <strong>{selectedRestaurant.name}</strong></p>
            <form onSubmit={handleAssignManager} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Select Manager</label>
                <select
                  value={assignManagerId}
                  onChange={(e) => setAssignManagerId(e.target.value)}
                  required
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">-- Select a manager --</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstname} {m.lastname} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.modalBtns}>
                <button type="button" onClick={() => { setShowAssignManager(false); setSelectedRestaurant(null); }} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={formLoading} style={styles.orangeBtn}>
                  {formLoading ? "Assigning..." : "Assign Manager"}
                </button>
              </div>
            </form>
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
            { key: "restaurants", label: "Restaurants", icon: "🏪", badge: restaurants.length },
            { key: "managers",    label: "Managers",    icon: "👨‍💼", badge: managers.length },
            { key: "orders",      label: "Orders",      icon: "📦", badge: orders.length },
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
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{user?.sub?.charAt(0)?.toUpperCase() || "A"}</div>
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
              {activeTab === "overview"    && "Admin Dashboard"}
              {activeTab === "users"       && "Manage Users"}
              {activeTab === "restaurants" && "Manage Restaurants"}
              {activeTab === "managers"    && "Manage Managers"}
              {activeTab === "orders"      && "All Orders"}
            </h1>
            <p style={styles.pageSubtitle}>
              {activeTab === "overview"    && "System overview and stats"}
              {activeTab === "users"       && `${userStats.total} registered users`}
              {activeTab === "restaurants" && `${restaurants.length} restaurants`}
              {activeTab === "managers"    && `${managers.length} managers`}
              {activeTab === "orders"      && `${orders.length} total orders`}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {activeTab === "restaurants" && (
              <button onClick={() => setShowCreateRestaurant(true)} style={styles.primaryBtn}>+ New Restaurant</button>
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
              { icon: "🏪", label: "Restaurants",   value: restaurants.length },
              { icon: "📦", label: "Total Orders",  value: orders.length },
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
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>{["Name", "Email", "Role", "Created At", "Action"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={5} style={styles.emptyCell}>No users found.</td></tr>
                ) : users.map((u) => (
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
                    <td style={styles.td}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—"}</td>
                    <td style={styles.td}>
                      <button onClick={() => setConfirmDelete({ id: u.id })} style={styles.deleteRowBtn}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Restaurants */}
        {activeTab === "restaurants" && !loading && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>{["Restaurant", "Location", "Status", "Action"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {restaurants.length === 0 ? (
                  <tr><td colSpan={4} style={styles.emptyCell}>No restaurants yet. Click "+ New Restaurant" to add one.</td></tr>
                ) : restaurants.map((r) => (
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
                    <td style={styles.td}>
                      <span style={{ ...styles.pill, background: r.status === "active" ? "#f0fdf4" : "#fef2f2", color: r.status === "active" ? "#16a34a" : "#dc2626" }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button onClick={() => { setSelectedRestaurant(r); setShowAssignManager(true); }} style={styles.assignBtn}>
                        Assign Manager
                      </button>
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
                <tr>{["Name", "Email", "Role"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {managers.length === 0 ? (
                  <tr><td colSpan={3} style={styles.emptyCell}>No managers yet. Click "+ New Manager" to create one.</td></tr>
                ) : managers.map((m) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Orders */}
        {activeTab === "orders" && !loading && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>{["Order ID", "Customer", "Total", "Status", "Date"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={5} style={styles.emptyCell}>No orders found.</td></tr>
                ) : orders.map((o) => {
                  const sc = statusColor(o.status);
                  return (
                    <tr key={o.id} style={styles.tr}>
                      <td style={styles.td}><span style={{ fontFamily: "monospace", fontWeight: "700" }}>#{o.id?.slice(0, 8).toUpperCase()}</span></td>
                      <td style={styles.td}>{o.user?.email || o.user?.firstname || "—"}</td>
                      <td style={styles.td}><strong style={{ color: "#FF6B35" }}>₱{o.totalAmount?.toFixed(2)}</strong></td>
                      <td style={styles.td}><span style={{ ...styles.pill, background: sc.bg, color: sc.color }}>{o.status}</span></td>
                      <td style={styles.td}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—"}</td>
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
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "white", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "460px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  modalTitle: { fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 6px" },
  modalText: { fontSize: "14px", color: "#888", margin: "0 0 1.25rem", lineHeight: "1.6" },
  modalBtns: { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "1.25rem" },
  cancelBtn: { padding: "9px 18px", borderRadius: "8px", border: "1px solid #ececec", background: "white", fontSize: "14px", cursor: "pointer", color: "#555" },
  redBtn: { padding: "9px 18px", borderRadius: "8px", border: "none", background: "#ef4444", color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  orangeBtn: { padding: "9px 18px", borderRadius: "8px", border: "none", background: "#FF6B35", color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontSize: "13px", fontWeight: "500", color: "#555" },
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
};