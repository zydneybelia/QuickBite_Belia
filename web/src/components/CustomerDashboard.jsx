import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8083/api";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("restaurants");
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchRestaurants();
    fetchOrders();
    fetchCart();
    // Decode basic user info from token
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);

      payload.role
    } catch {}
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/restaurants`, authHeaders);
      setRestaurants(res.data);
    } catch (err) {
      console.error("Failed to fetch restaurants", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async (restaurantId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/menu-items/restaurant/${restaurantId}`, authHeaders);
      setMenuItems(res.data);
    } catch (err) {
      console.error("Failed to fetch menu", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API_URL}/carts`, authHeaders);
      setCart(res.data?.cartItems || []);
    } catch (err) {
      console.error("Failed to fetch cart", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders`, authHeaders);
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    }
  };

  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    fetchMenuItems(restaurant.id);
    setActiveTab("menu");
  };

  const handleAddToCart = (item) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(cart.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (itemId) => {
    setCart(cart.filter((c) => c.id !== itemId));
  };

  const handleQuantityChange = (itemId, delta) => {
    setCart(cart.map((c) => {
      if (c.id === itemId) {
        const newQty = c.quantity + delta;
        return newQty <= 0 ? null : { ...c, quantity: newQty };
      }
      return c;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
            { key: "restaurants", label: "Restaurants", icon: "🏪" },
            { key: "menu", label: "Menu", icon: "🍽️" },
            { key: "cart", label: "Cart", icon: "🛒", badge: cartCount },
            { key: "orders", label: "My Orders", icon: "📦" },
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
              {user?.sub?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <p style={styles.userName}>{user?.sub || "User"}</p>
              <p style={styles.userRole}>Customer</p>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              {activeTab === "restaurants" && "Browse Restaurants"}
              {activeTab === "menu" && (selectedRestaurant ? selectedRestaurant.name : "Menu")}
              {activeTab === "cart" && "Your Cart"}
              {activeTab === "orders" && "My Orders"}
            </h1>
            <p style={styles.pageSubtitle}>
              {activeTab === "restaurants" && "Find your favorite food nearby"}
              {activeTab === "menu" && selectedRestaurant?.location}
              {activeTab === "cart" && `${cartCount} item${cartCount !== 1 ? "s" : ""} in cart`}
              {activeTab === "orders" && `${orders.length} order${orders.length !== 1 ? "s" : ""} placed`}
            </p>
          </div>
          {activeTab === "menu" && (
            <button onClick={() => setActiveTab("restaurants")} style={styles.backBtn}>
              ← Back
            </button>
          )}
          {activeTab === "cart" && cart.length > 0 && (
            <div style={styles.cartTotal}>
              Total: <strong style={{ color: "#FF6B35" }}>₱{cartTotal.toFixed(2)}</strong>
            </div>
          )}
        </div>

        {loading && (
          <div style={styles.loadingRow}>
            <div style={styles.spinner} />
            <span style={{ color: "#aaa", fontSize: "14px" }}>Loading...</span>
          </div>
        )}

        {/* Restaurants Tab */}
        {activeTab === "restaurants" && !loading && (
          <div style={styles.grid}>
            {restaurants.length === 0 ? (
              <div style={styles.empty}>
                <span style={{ fontSize: "48px" }}>🏪</span>
                <p>No restaurants available yet.</p>
              </div>
            ) : (
              restaurants.map((r) => (
                <div
                  key={r.id}
                  style={styles.card}
                  onClick={() => handleSelectRestaurant(r)}
                >
                  <div style={styles.cardImg}>
                    <span style={{ fontSize: "40px" }}>🍽️</span>
                  </div>
                  <div style={styles.cardBody}>
                    <h3 style={styles.cardTitle}>{r.name}</h3>
                    <p style={styles.cardSub}>{r.description || "Delicious food awaits"}</p>
                    <div style={styles.cardMeta}>
                      <span style={styles.metaTag}>📍 {r.location || "Cebu City"}</span>
                      <span style={{
                        ...styles.statusPill,
                        background: r.status === "active" ? "#f0fdf4" : "#fef2f2",
                        color: r.status === "active" ? "#16a34a" : "#dc2626",
                      }}>
                        {r.status === "active" ? "Open" : "Closed"}
                      </span>
                    </div>
                    <button style={styles.viewBtn}>View Menu →</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === "menu" && !loading && (
          <div style={styles.grid}>
            {menuItems.length === 0 ? (
              <div style={styles.empty}>
                <span style={{ fontSize: "48px" }}>🍽️</span>
                <p>No menu items available.</p>
              </div>
            ) : (
              menuItems.map((item) => (
                <div key={item.id} style={styles.menuCard}>
                  <div style={styles.menuImg}>
                    <span style={{ fontSize: "36px" }}>🍴</span>
                  </div>
                  <div style={styles.menuBody}>
                    <div style={styles.menuTop}>
                      <h3 style={styles.menuName}>{item.name}</h3>
                      <span style={{
                        ...styles.availBadge,
                        background: item.availability ? "#f0fdf4" : "#fef2f2",
                        color: item.availability ? "#16a34a" : "#dc2626",
                      }}>
                        {item.availability ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <p style={styles.menuDesc}>{item.description || "A delicious menu item"}</p>
                    <div style={styles.menuFooter}>
                      <span style={styles.price}>₱{item.price?.toFixed(2)}</span>
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.availability}
                        style={{
                          ...styles.addBtn,
                          opacity: item.availability ? 1 : 0.4,
                          cursor: item.availability ? "pointer" : "not-allowed",
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Cart Tab */}
        {activeTab === "cart" && (
          <div style={styles.cartContainer}>
            {cart.length === 0 ? (
              <div style={styles.empty}>
                <span style={{ fontSize: "48px" }}>🛒</span>
                <p>Your cart is empty.</p>
                <button onClick={() => setActiveTab("restaurants")} style={styles.viewBtn}>
                  Browse Restaurants
                </button>
              </div>
            ) : (
              <>
                <div style={styles.cartList}>
                  {cart.map((item) => (
                    <div key={item.id} style={styles.cartItem}>
                      <div style={styles.cartItemIcon}>🍴</div>
                      <div style={styles.cartItemInfo}>
                        <p style={styles.cartItemName}>{item.name}</p>
                        <p style={styles.cartItemPrice}>₱{item.price?.toFixed(2)} each</p>
                      </div>
                      <div style={styles.qtyControls}>
                        <button onClick={() => handleQuantityChange(item.id, -1)} style={styles.qtyBtn}>−</button>
                        <span style={styles.qtyNum}>{item.quantity}</span>
                        <button onClick={() => handleQuantityChange(item.id, 1)} style={styles.qtyBtn}>+</button>
                      </div>
                      <span style={styles.cartItemTotal}>
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button onClick={() => handleRemoveFromCart(item.id)} style={styles.removeBtn}>✕</button>
                    </div>
                  ))}
                </div>
                <div style={styles.cartSummary}>
                  <div style={styles.summaryRow}>
                    <span style={{ color: "#888" }}>Subtotal</span>
                    <span>₱{cartTotal.toFixed(2)}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span style={{ color: "#888" }}>Delivery fee</span>
                    <span>₱50.00</span>
                  </div>
                  <div style={{ ...styles.summaryRow, borderTop: "1px solid #f0f0f0", paddingTop: "12px", marginTop: "4px" }}>
                    <span style={{ fontWeight: "600", fontSize: "16px" }}>Total</span>
                    <span style={{ fontWeight: "700", fontSize: "18px", color: "#FF6B35" }}>
                      ₱{(cartTotal + 50).toFixed(2)}
                    </span>
                  </div>
                  <button style={styles.checkoutBtn}>
                    Place Order →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div style={styles.ordersList}>
            {orders.length === 0 ? (
              <div style={styles.empty}>
                <span style={{ fontSize: "48px" }}>📦</span>
                <p>You haven't placed any orders yet.</p>
                <button onClick={() => setActiveTab("restaurants")} style={styles.viewBtn}>
                  Order Now
                </button>
              </div>
            ) : (
              orders.map((order) => {
                const sc = statusColor(order.status);
                return (
                  <div key={order.id} style={styles.orderCard}>
                    <div style={styles.orderHeader}>
                      <div>
                        <p style={styles.orderId}>Order #{order.id?.slice(0, 8).toUpperCase()}</p>
                        <p style={styles.orderDate}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-PH", {
                            year: "numeric", month: "short", day: "numeric",
                          }) : "—"}
                        </p>
                      </div>
                      <span style={{
                        ...styles.statusPill,
                        background: sc.bg,
                        color: sc.color,
                        fontWeight: "600",
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={styles.orderFooter}>
                      <span style={styles.orderTotal}>
                        Total: <strong>₱{order.totalAmount?.toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
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
 // In CustomerDashboard.jsx styles, find sidebarFooter and replace:
    sidebarFooter: {
    borderTop: "1px solid #f0f0f0",
    paddingTop: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "auto",        // ✅ pushes footer to bottom
    paddingBottom: "1rem",    // ✅ adds space at bottom
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
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
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
  backBtn: {
    background: "none",
    border: "1px solid #ececec",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "13px",
    color: "#555",
    cursor: "pointer",
  },
  cartTotal: {
    fontSize: "15px",
    color: "#555",
    background: "white",
    border: "1px solid #ececec",
    borderRadius: "10px",
    padding: "10px 16px",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "white",
    borderRadius: "14px",
    border: "1px solid #ececec",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  cardImg: {
    height: "100px",
    background: "#fff4f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: "14px",
  },
  cardTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0 0 4px",
  },
  cardSub: {
    fontSize: "12px",
    color: "#aaa",
    margin: "0 0 10px",
  },
  cardMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  metaTag: {
    fontSize: "11px",
    color: "#888",
  },
  statusPill: {
    fontSize: "11px",
    fontWeight: "600",
    padding: "3px 8px",
    borderRadius: "999px",
  },
  viewBtn: {
    background: "#FF6B35",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
  },
  menuCard: {
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
  },
  menuBody: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
  },
  menuTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "8px",
  },
  menuName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: 0,
  },
  availBadge: {
    fontSize: "10px",
    fontWeight: "600",
    padding: "2px 7px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
  },
  menuDesc: {
    fontSize: "12px",
    color: "#aaa",
    margin: 0,
  },
  menuFooter: {
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
  addBtn: {
    background: "#FF6B35",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  cartContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: "16px",
    alignItems: "start",
  },
  cartList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  cartItem: {
    background: "white",
    borderRadius: "12px",
    border: "1px solid #ececec",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  cartItemIcon: {
    fontSize: "28px",
    width: "44px",
    height: "44px",
    background: "#fff4f0",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1a1a1a",
    margin: "0 0 2px",
  },
  cartItemPrice: {
    fontSize: "12px",
    color: "#aaa",
    margin: 0,
  },
  qtyControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  qtyBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    border: "1px solid #ececec",
    background: "white",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FF6B35",
    fontWeight: "700",
  },
  qtyNum: {
    fontSize: "14px",
    fontWeight: "600",
    minWidth: "20px",
    textAlign: "center",
  },
  cartItemTotal: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1a1a1a",
    minWidth: "70px",
    textAlign: "right",
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#ccc",
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px",
  },
  cartSummary: {
    background: "white",
    borderRadius: "14px",
    border: "1px solid #ececec",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    position: "sticky",
    top: "2rem",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#333",
  },
  checkoutBtn: {
    marginTop: "8px",
    background: "#FF6B35",
    color: "white",
    border: "none",
    borderRadius: "999px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    width: "100%",
  },
  ordersList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "680px",
  },
  orderCard: {
    background: "white",
    borderRadius: "14px",
    border: "1px solid #ececec",
    padding: "16px 20px",
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  orderId: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0 0 2px",
  },
  orderDate: {
    fontSize: "12px",
    color: "#aaa",
    margin: 0,
  },
  orderFooter: {
    borderTop: "1px solid #f5f5f5",
    paddingTop: "10px",
  },
  orderTotal: {
    fontSize: "14px",
    color: "#555",
  },
  empty: {
    gridColumn: "1 / -1",
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