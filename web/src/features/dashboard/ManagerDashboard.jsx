import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8083/api";

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch {}
    // Fetch manager's restaurant and related data
    loadManagerData();
  }, []);

  const loadManagerData = async () => {
    setLoading(true);
    try {
      // Get restaurants (filtered by ownerId in backend)
      const restaurantRes = await axios.get(`${API_URL}/restaurants`, authHeaders);
      if (restaurantRes.data && restaurantRes.data.length > 0) {
        setRestaurant(restaurantRes.data[0]);
        // Fetch orders for this restaurant
        fetchOrders(restaurantRes.data[0].id);
        fetchMenuItems(restaurantRes.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load manager data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (restaurantId) => {
    try {
      const res = await axios.get(`${API_URL}/orders`, authHeaders);
      // Filter orders for this restaurant
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    }
  };

  const fetchMenuItems = async (restaurantId) => {
    try {
      const res = await axios.get(`${API_URL}/menu-items/restaurant/${restaurantId}`, authHeaders);
      setMenuItems(res.data);
    } catch (err) {
      console.error("Failed to fetch menu items", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const statusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "PLACED": return { bg: "#fff7ed", color: "#ea580c" };
      case "PREPARING": return { bg: "#fef9c3", color: "#ca8a04" };
      case "DELIVERED": return { bg: "#f0fdf4", color: "#16a34a" };
      default: return { bg: "#f3f4f6", color: "#6b7280" };
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalOrders = orders.length;

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

        <nav style={styles.nav}>
          {[
            { key: "overview", label: "Overview", icon: "📊" },
            { key: "orders", label: "Orders", icon: "📦", badge: totalOrders },
            { key: "menu", label: "Menu Items", icon: "🍽️", badge: menuItems.length },
            { key: "restaurant", label: "Restaurant", icon: "🏪" },
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
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span style={styles.badge}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {user?.sub?.charAt(0)?.toUpperCase() || "M"}
            </div>
            <div>
              <p style={styles.userName}>{user?.sub || "Manager"}</p>
              <p style={styles.userRole}>Restaurant Manager</p>
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
            <h1 style={styles.pageTitle}>
              {activeTab === "overview" && "Manager Dashboard"}
              {activeTab === "orders" && "Orders"}
              {activeTab === "menu" && "Menu Items"}
              {activeTab === "restaurant" && "Restaurant"}
            </h1>
            <p style={styles.pageSubtitle}>
              {activeTab === "overview" && `Managing ${restaurant?.name || "your restaurant"}`}
              {activeTab === "orders" && `${totalOrders} order${totalOrders !== 1 ? "s" : ""} total`}
              {activeTab === "menu" && `${menuItems.length} item${menuItems.length !== 1 ? "s" : ""} on menu`}
              {activeTab === "restaurant" && restaurant?.name || ""}
            </p>
          </div>
        </div>

        {loading && (
          <div style={styles.loadingRow}>
            <div style={styles.spinner} />
            <span style={{ color: "#aaa", fontSize: "14px" }}>Loading...</span>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div style={styles.overviewGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📦</div>
              <div>
                <p style={styles.statLabel}>Total Orders</p>
                <p style={styles.statValue}>{totalOrders}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>💰</div>
              <div>
                <p style={styles.statLabel}>Revenue</p>
                <p style={styles.statValue}>₱{totalRevenue.toFixed(2)}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>🍽️</div>
              <div>
                <p style={styles.statLabel}>Menu Items</p>
                <p style={styles.statValue}>{menuItems.length}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>⭐</div>
              <div>
                <p style={styles.statLabel}>Rating</p>
                <p style={styles.statValue}>{restaurant?.rating || "4.5"}/5</p>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div style={styles.ordersContainer}>
            {orders.length === 0 ? (
              <div style={styles.empty}>
                <span style={{ fontSize: "48px" }}>📦</span>
                <p>No orders yet.</p>
              </div>
            ) : (
              <div style={styles.ordersList}>
                {orders.map((order) => {
                  const sc = statusColor(order.status);
                  return (
                    <div key={order.id} style={styles.orderRow}>
                      <div style={styles.orderRowLeft}>
                        <p style={styles.orderNo}>Order #{order.id?.slice(0, 8).toUpperCase()}</p>
                        <p style={styles.orderMeta}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <div style={styles.orderRowCenter}>
                        <p style={styles.orderItems}>{order.items?.length || 0} item(s)</p>
                      </div>
                      <div style={styles.orderRowRight}>
                        <p style={styles.orderPrice}>₱{order.totalAmount?.toFixed(2)}</p>
                        <span style={{
                          ...styles.statusPill,
                          background: sc.bg,
                          color: sc.color,
                          fontWeight: "600",
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Menu Items Tab */}
        {activeTab === "menu" && (
          <div style={styles.menuGrid}>
            {menuItems.length === 0 ? (
              <div style={styles.empty}>
                <span style={{ fontSize: "48px" }}>🍽️</span>
                <p>No menu items yet.</p>
              </div>
            ) : (
              menuItems.map((item) => (
                <div key={item.id} style={styles.menuItemCard}>
                  <div style={styles.menuImg}>🍴</div>
                  <div style={styles.menuCardBody}>
                    <h3 style={styles.menuName}>{item.name}</h3>
                    <p style={styles.menuDesc}>{item.description || "A delicious item"}</p>
                    <div style={styles.menuCardFooter}>
                      <span style={styles.price}>₱{item.price?.toFixed(2)}</span>
                      <span style={{
                        ...styles.availPill,
                        background: item.availability ? "#f0fdf4" : "#fef2f2",
                        color: item.availability ? "#16a34a" : "#dc2626",
                      }}>
                        {item.availability ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Restaurant Tab */}
        {activeTab === "restaurant" && restaurant && (
          <div style={styles.restaurantDetails}>
            <div style={styles.restCard}>
              <div style={styles.restImg}>🏪</div>
              <div style={styles.restBody}>
                <h2 style={styles.restName}>{restaurant.name}</h2>
                <p style={styles.restDesc}>{restaurant.description}</p>
                <div style={styles.restMeta}>
                  <div style={styles.metaItem}>
                    <span style={{ color: "#aaa", fontSize: "13px" }}>📍 Location</span>
                    <p style={styles.metaValue}>{restaurant.location}</p>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={{ color: "#aaa", fontSize: "13px" }}>🕐 Hours</span>
                    <p style={styles.metaValue}>{restaurant.openingHours || "9 AM - 10 PM"}</p>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={{ color: "#aaa", fontSize: "13px" }}>📞 Phone</span>
                    <p style={styles.metaValue}>{restaurant.phone || "Not set"}</p>
                  </div>
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
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#f7f5f2",
    fontFamily: "'Segoe UI', sans-serif",
  },
  sidebar: {
    width: "240px",
    minHeight: "100vh",
    background: "#ffffff",
    borderRight: "1px solid #ececec",
    display: "flex",
    flexDirection: "column",
    padding: "1.5rem 1rem",
    position: "fixed",
    top: 0, left: 0, bottom: 0,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "2rem",
    paddingLeft: "4px",
  },
  logoIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "#FF6B35",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: "-0.3px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left",
    transition: "background 0.15s",
    position: "relative",
  },
  badge: {
    marginLeft: "auto",
    background: "#FF6B35",
    color: "white",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 7px",
  },
  sidebarFooter: {
    borderTop: "1px solid #f0f0f0",
    paddingTop: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "auto",
    paddingBottom: "1rem",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#fff4f0",
    color: "#FF6B35",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
  },
  userName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1a1a1a",
    margin: 0,
    maxWidth: "130px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userRole: {
    fontSize: "11px",
    color: "#aaa",
    margin: 0,
  },
  logoutBtn: {
    background: "none",
    border: "1px solid #ececec",
    borderRadius: "8px",
    padding: "10px",
    fontSize: "13px",
    color: "#888",
    cursor: "pointer",
  },
  main: {
    marginLeft: "240px",
    flex: 1,
    padding: "2rem",
  },
  header: {
    marginBottom: "2rem",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0 0 4px",
    letterSpacing: "-0.4px",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#aaa",
    margin: 0,
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "2rem 0",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid #f0f0f0",
    borderTop: "2px solid #FF6B35",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  statCard: {
    background: "white",
    borderRadius: "14px",
    border: "1px solid #ececec",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  statIcon: {
    fontSize: "32px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#aaa",
    margin: "0 0 4px",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: 0,
  },
  ordersContainer: {
    background: "white",
    borderRadius: "14px",
    border: "1px solid #ececec",
    padding: "20px",
  },
  ordersList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  orderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f5f5f5",
  },
  orderRowLeft: {
    flex: 1,
  },
  orderNo: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1a1a1a",
    margin: "0 0 2px",
  },
  orderMeta: {
    fontSize: "12px",
    color: "#aaa",
    margin: 0,
  },
  orderRowCenter: {
    flex: 1,
    textAlign: "center",
  },
  orderItems: {
    fontSize: "14px",
    color: "#555",
    margin: 0,
  },
  orderRowRight: {
    flex: 1,
    textAlign: "right",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    justifyContent: "flex-end",
  },
  orderPrice: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#FF6B35",
    margin: 0,
  },
  statusPill: {
    fontSize: "11px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "999px",
  },
  menuGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "16px",
  },
  menuItemCard: {
    background: "white",
    borderRadius: "14px",
    border: "1px solid #ececec",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  menuImg: {
    height: "80px",
    background: "#fff9f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
  },
  menuCardBody: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
  },
  menuName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: 0,
  },
  menuDesc: {
    fontSize: "12px",
    color: "#aaa",
    margin: 0,
  },
  menuCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: "8px",
  },
  price: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#FF6B35",
  },
  availPill: {
    fontSize: "10px",
    fontWeight: "600",
    padding: "2px 7px",
    borderRadius: "999px",
  },
  restaurantDetails: {
    maxWidth: "600px",
  },
  restCard: {
    background: "white",
    borderRadius: "14px",
    border: "1px solid #ececec",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  restImg: {
    height: "100px",
    background: "#fff4f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "48px",
  },
  restBody: {
    padding: "20px",
  },
  restName: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0 0 8px",
  },
  restDesc: {
    fontSize: "14px",
    color: "#aaa",
    margin: "0 0 16px",
  },
  restMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  metaItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  metaValue: {
    fontSize: "14px",
    color: "#1a1a1a",
    fontWeight: "600",
    margin: 0,
  },
  empty: {
    textAlign: "center",
    padding: "4rem 2rem",
    color: "#aaa",
    fontSize: "15px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
};
