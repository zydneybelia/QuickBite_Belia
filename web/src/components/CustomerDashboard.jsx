import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8086/api";
const CART_STORAGE_PREFIX = "quickbite_customer_cart_";
const getCartKey = () => {
  const tok = localStorage.getItem("token");
  if (!tok) return CART_STORAGE_PREFIX + "guest";
  try {
    const payload = JSON.parse(atob(tok.split(".")[1]));
    return CART_STORAGE_PREFIX + (payload.userId || payload.id || payload.sub || "guest");
  } catch {
    return CART_STORAGE_PREFIX + "guest";
  }
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("restaurants");
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(getCartKey());
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error("Failed to load saved cart", err);
      return [];
    }
  });
  const [orders, setOrders] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ firstname: "", lastname: "", email: "", contactNumber: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [orderPlacedMsg, setOrderPlacedMsg] = useState("");
  const [showOrderPlaced, setShowOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [paymentReference, setPaymentReference] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [addToCartModalOpen, setAddToCartModalOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState(null);
  const [addQty, setAddQty] = useState(1);
  const [cartNotification, setCartNotification] = useState({ show: false, message: "" });
  const [orderNowItem, setOrderNowItem] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

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

  const fetchUserProfile = async () => {
    const userId = getCurrentUserId() || getUserIdFromToken();
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

  const handleStartEditProfile = () => setIsEditingProfile(true);

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
      setUser((prevUser) => ({
        ...prevUser,
        sub: res.data.firstname ? `${res.data.firstname} ${res.data.lastname || ""}` : (res.data.email || prevUser?.sub),
      }));
      const display = res.data.firstname ? `${res.data.firstname} ${res.data.lastname || ""}`.trim() : (res.data.email || null);
      if (display) localStorage.setItem("displayName", display);
      setIsEditingProfile(false);
      alert("Profile updated successfully.");
      setShowProfileModal(false);
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

  const displayName = (typeof window !== 'undefined' && localStorage.getItem('displayName')) || user?.sub || "User";

  const fetchOrders = async (userId) => {
    try {
      const endpoint = userId ? `${API_URL}/orders/user/${userId}` : `${API_URL}/orders/me`;
      const res = await axios.get(endpoint, authHeaders);
      console.log('fetchOrders response:', res.data);
      const sortedOrders = Array.isArray(res.data) 
        ? res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) 
        : [];
      setOrders(sortedOrders);
    } catch (err) {
      console.error("Failed to fetch orders", err);
      setOrders([]);
    }
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchRestaurants();
    fetchAllMenuItems();
    fetchCart();
    // Decode basic user info from token
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
      const userId = payload.userId || payload.id || payload.sub || null;
      fetchOrders(userId);
      fetchFavorites();
    } catch {
      fetchOrders();
      fetchFavorites();
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "orders" && activeTab !== "activity") return;
    fetchOrders(getCurrentUserId());
  }, [activeTab]);

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) return;
    
    // Add all items from the order to the cart
    const newCart = [...cart];
    order.items.forEach(orderItem => {
      // Find the menu item in our allMenuItems list to get the latest info
      const menuItem = allMenuItems.find(m => m.name === orderItem.name);
      if (menuItem) {
        const existing = newCart.find(c => c.id === menuItem.id);
        if (existing) {
          existing.quantity += orderItem.quantity;
        } else {
          newCart.push({ ...menuItem, quantity: orderItem.quantity });
        }
      }
    });
    
    setCart(newCart);
    setActiveTab("cart");
  };

  const getOrderStatusTimeline = (status) => {
    const steps = ["PLACED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
    const currentIndex = steps.indexOf(status?.toUpperCase());
    return steps.map((step, index) => ({
      label: step.replace(/_/g, " "),
      completed: index <= currentIndex,
      active: index === currentIndex
    }));
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/customer/restaurants`, authHeaders);
      const restaurantsRes = Array.isArray(res.data)
        ? res.data
        : res.data?.restaurants || [];
      if (!Array.isArray(res.data)) {
        console.error("Unexpected restaurants response shape", res.data);
      }
      setRestaurants(restaurantsRes);
    } catch (err) {
      console.error("Failed to fetch restaurants", err);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`${API_URL}/customer/restaurants/favorites`, authHeaders);
      setFavorites(res.data || []);
    } catch (err) {
      console.error("Failed to fetch favorites", err);
    }
  };

  const handleToggleFavorite = async (e, restaurantId) => {
      e.stopPropagation();
      try {
        const res = await axios.post(`${API_URL}/customer/restaurants/${restaurantId}/favorite`, {}, authHeaders);
        if (res.data.favorite) {
          setFavorites(prev => [...new Set([...prev, restaurantId])]);
        } else {
          setFavorites(prev => prev.filter(id => id !== restaurantId));
        }
      } catch (err) {
        console.error("Failed to toggle favorite", err);
      }
    };

  const fetchMenuItems = async (restaurantId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/customer/restaurants/${restaurantId}/menu`, authHeaders);
      setMenuItems(res.data);
    } catch (err) {
      console.error("Failed to fetch menu", err);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMenuItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/customer/restaurants/menu`, authHeaders);
      setAllMenuItems(res.data || []);
      if (!selectedRestaurant) {
        setMenuItems(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch all menu items", err);
      setAllMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const savedCart = localStorage.getItem(getCartKey());
      if (savedCart) {
        setCart(JSON.parse(savedCart));
        return;
      }
    } catch (err) {
      console.error("Failed to parse saved cart", err);
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.userId || payload.id || payload.sub || null;
      const endpoint = userId ? `${API_URL}/carts/user/${userId}` : `${API_URL}/carts/me`;
      const res = await axios.get(endpoint, authHeaders);
      setCart(res.data?.cartItems || res.data || []);
    } catch (err) {
      console.error("Failed to fetch cart", err);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(getCartKey(), JSON.stringify(cart));
    } catch (err) {
      console.error("Failed to persist cart", err);
    }
  }, [cart]);

  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    fetchMenuItems(restaurant.id);
    setActiveTab("menu");
  };

  useEffect(() => {
    if (activeTab === "menu" && !selectedRestaurant) {
      setMenuItems(allMenuItems);
    }
  }, [activeTab, selectedRestaurant, allMenuItems]);

  const handleAddToCart = (item) => {
    setItemToAdd(item);
    const existing = cart.find((c) => c.id === item.id);
    setAddQty(existing ? existing.quantity : 1);
    setAddToCartModalOpen(true);
  };

  const handleConfirmAddToCart = () => {
    if (!itemToAdd) return;
    
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex((c) => c.id === itemToAdd.id);
      if (existingIndex !== -1) {
        // Update existing item's quantity (set it to what was in the modal)
        const updatedCart = [...prevCart];
        updatedCart[existingIndex] = { 
          ...updatedCart[existingIndex], 
          quantity: addQty 
        };
        return updatedCart;
      } else {
        // Add new item with selected quantity
        return [...prevCart, { ...itemToAdd, quantity: addQty }];
      }
    });

    // Show notification
    setCartNotification({ show: true, message: `${itemToAdd.name} added to cart!` });
    setTimeout(() => setCartNotification({ show: false, message: "" }), 3000);

    setAddToCartModalOpen(false);
    setItemToAdd(null);
    setAddQty(1);
  };

  const handleCloseAddModal = () => {
    setAddToCartModalOpen(false);
    setItemToAdd(null);
    setAddQty(1);
  };

  const handleOrderNow = (item) => {
    // Instead of adding to cart, we set it as a separate "Order Now" item
    setOrderNowItem({ ...item, quantity: 1 });
    
    // Open checkout modal immediately
    setCheckoutStep(1);
    setCheckoutOpen(true);
  };

  const handleRemoveFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter((c) => c.id !== itemId));
  };

  const handleQuantityChange = (itemId, delta) => {
    // If we are in "Order Now" mode, update the orderNowItem quantity
    if (orderNowItem && orderNowItem.id === itemId) {
      const newQty = orderNowItem.quantity + delta;
      if (newQty <= 0) {
        closeCheckoutModal();
      } else {
        setOrderNowItem({ ...orderNowItem, quantity: newQty });
      }
      return;
    }

    setCart(prevCart => prevCart.map((c) => {
      if (c.id === itemId) {
        const newQty = c.quantity + delta;
        return newQty <= 0 ? null : { ...c, quantity: newQty };
      }
      return c;
    }).filter(Boolean));
  };

  const openCheckoutModal = () => {
    if (cart.length === 0) return;
    setCheckoutStep(1);
    setCheckoutOpen(true);
  };

  const closeCheckoutModal = () => {
    setCheckoutOpen(false);
    setCheckoutStep(1);
    setPaymentMethod("cash_on_delivery");
    setPaymentReference("");
    setDeliveryAddress("");
    setOrderNowItem(null);
  };

  const checkoutItemCount = orderNowItem 
    ? orderNowItem.quantity 
    : cart.reduce((sum, item) => sum + item.quantity, 0);

  const checkoutSubtotal = orderNowItem 
    ? orderNowItem.price * orderNowItem.quantity 
    : cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const deliveryFee = checkoutItemCount > 0 ? 50 : 0;
  const checkoutTotal = checkoutSubtotal + deliveryFee;

  const visibleCheckoutItems = orderNowItem 
    ? [orderNowItem] 
    : cart.filter((item) => item.quantity > 0);
  const restaurantName = selectedRestaurant?.name || "Selected Restaurant";
  const restaurantLocation = selectedRestaurant?.location || "Your location";
  const estimatedDelivery = selectedRestaurant?.estimatedDelivery || "25–35 min";

  const handleProceedToReview = () => {
    if (checkoutItemCount > 0) {
      setCheckoutStep(2);
    }
  };

  const handleConfirmPay = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error("Unable to place order: missing user ID");
        return;
      }

      if (!deliveryAddress.trim()) {
        alert("Please enter a delivery address.");
        return;
      }

      // Validate payment reference for GCash/Maya
      if ((paymentMethod === "gcash" || paymentMethod === "maya") && paymentReference.length !== 11) {
        alert(`Please enter a valid 11-digit number for ${paymentMethod === "gcash" ? "GCash" : "Maya"}`);
        return;
      }

      const orderData = {
        userId,
        deliveryAddress: deliveryAddress.trim(),
        items: visibleCheckoutItems.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
        paymentMethod,
      };

      if (paymentReference) {
        orderData.paymentReference = paymentReference;
      }

      await axios.post(`${API_URL}/orders`, orderData, authHeaders);

      // If it was "Order Now", remove only that item from the cart if it existed
      if (orderNowItem) {
        setCart(prevCart => prevCart.filter(c => c.id !== orderNowItem.id));
      } else {
        // If it was a regular cart checkout, clear the entire cart
        setCart([]);
        localStorage.removeItem(getCartKey());
      }

      // Close checkout modal immediately
      closeCheckoutModal();
      
      // Refresh orders for the user and navigate to Activity tab so user sees the new order
      await fetchOrders(userId);
      setActiveTab("activity");
      setOrderPlacedMsg("Your order has been placed.");
      setShowOrderPlaced(true);
      setTimeout(() => setShowOrderPlaced(false), 5000);
    } catch (err) {
      console.error("Checkout failed", err);
      const data = err.response?.data;
      let errorMsg = "Failed to place order. Please try again.";
      
      if (data) {
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.message) {
          errorMsg = data.message;
        } else {
          errorMsg = JSON.stringify(data);
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      alert(errorMsg);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const restaurantList = Array.isArray(restaurants) ? restaurants : [];

  // Extract unique categories from restaurants
  const categories = ["all", ...new Set(restaurantList.map(r => r.category || "Other"))];

  // Filter restaurants by search and category
  const filteredRestaurants = restaurantList.filter(restaurant => {
    const matchesSearch =
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (restaurant.description && restaurant.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (restaurant.location && restaurant.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || (restaurant.category || "Other") === selectedCategory;

    const matchesTab = activeTab !== "favorites" || favorites.includes(restaurant.id);

    return matchesSearch && matchesCategory && matchesTab;
  });

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      // Do not remove per-user cart on logout so carts persist per user across sessions
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const statusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "PLACED": return { bg: "#fff7ed", color: "#ea580c" };
      case "PREPARING": return { bg: "#fef9c3", color: "#ca8a04" };
      case "OUT_FOR_DELIVERY": return { bg: "#eff6ff", color: "#2563eb" };
      case "DELIVERED": return { bg: "#f0fdf4", color: "#16a34a" };
      case "CANCELLED": return { bg: "#fef2f2", color: "#dc2626" };
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
            { key: "favorites", label: "Favorites", icon: "❤️" },
            { key: "activity", label: "Activity", icon: "⚡" },
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
          <div style={{ ...styles.userInfo, cursor: 'pointer' }} onClick={handleOpenProfile}>
            <div style={styles.avatar}>
              {(displayName?.charAt(0) || "U").toUpperCase()}
            </div>
            <div>
              <p style={styles.userName}>{displayName}</p>
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
              {activeTab === "favorites" && "Your Favorites"}
              {activeTab === "activity" && "Recent Activity"}
              {activeTab === "menu" && (selectedRestaurant ? selectedRestaurant.name : "Menu")}
              {activeTab === "cart" && "Your Cart"}
              {activeTab === "orders" && "My Orders"}
            </h1>
            <p style={styles.pageSubtitle}>
              {activeTab === "restaurants" && "Find your favorite food nearby"}
              {activeTab === "favorites" && `${favorites.length} restaurant${favorites.length !== 1 ? "s" : ""} saved`}
              {activeTab === "activity" && "Track your orders and reorder favorites"}
              {activeTab === "menu" && selectedRestaurant?.location}
              {activeTab === "cart" && `${cartCount} item${cartCount !== 1 ? "s" : ""} in cart`}
              {activeTab === "orders" && `${orders.length} order${orders.length !== 1 ? "s" : ""} placed`}
            </p>
          </div>
          {showOrderPlaced && (
            <div style={styles.successBanner}>{orderPlacedMsg}</div>
          )}
          {cartNotification.show && (
            <div style={styles.cartNotification}>{cartNotification.message}</div>
          )}
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

        {/* Search & Filter Bar (Restaurants & Favorites Tab) */}
        {(activeTab === "restaurants" || activeTab === "favorites") && (
          <div style={styles.filterBar}>
            <input
              type="text"
              placeholder="Search restaurants, cuisine, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={styles.filterSelect}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading && (
          <div style={styles.loadingRow}>
            <div style={styles.spinner} />
            <span style={{ color: "#aaa", fontSize: "14px" }}>Loading...</span>
          </div>
        )}

        {/* Restaurants & Favorites Tab */}
        {(activeTab === "restaurants" || activeTab === "favorites") && !loading && (
          <div style={styles.grid}>
            {filteredRestaurants.length === 0 ? (
              <div style={styles.empty}>
                <span style={{ fontSize: "48px" }}>{activeTab === "favorites" ? "❤️" : "🏪"}</span>
                <p>
                  {activeTab === "favorites" 
                    ? (favorites.length === 0 ? "You haven't favorited any restaurants yet." : "No favorites match your search.")
                    : (restaurantList.length === 0 ? "No restaurants available yet." : "No restaurants match your search.")
                  }
                </p>
              </div>
            ) : (
              filteredRestaurants.map((r) => (
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
                    <div style={styles.cardActions}>
                      <button style={styles.viewBtn}>View Menu →</button>
                      <button
                        onClick={(e) => handleToggleFavorite(e, r.id)}
                        style={{
                          ...styles.favoriteBtn,
                          color: favorites.includes(r.id) ? "#FF6B35" : "#ccc",
                          borderColor: favorites.includes(r.id) ? "#FF6B35" : "#ececec",
                          background: favorites.includes(r.id) ? "#fff4f0" : "#fff",
                        }}
                        title={favorites.includes(r.id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <svg 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill={favorites.includes(r.id) ? "#FF6B35" : "none"} 
                          stroke={favorites.includes(r.id) ? "#FF6B35" : "#ccc"} 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && !loading && (
          <div style={styles.activityContainer}>
            {/* Active Orders Section */}
            <section style={styles.activitySection}>
              <h2 style={styles.sectionTitle}>Current Orders</h2>
              {orders.filter(o => ["PLACED", "PREPARING", "OUT_FOR_DELIVERY"].includes(o.status?.toUpperCase())).length === 0 ? (
                <p style={styles.emptyText}>No active orders at the moment.</p>
              ) : (
                <div style={styles.activityGrid}>
                  {orders.filter(o => ["PLACED", "PREPARING", "OUT_FOR_DELIVERY"].includes(o.status?.toUpperCase())).map(order => (
                    <div key={order.id} style={styles.activityCard}>
                      <div style={styles.activityCardHeader}>
                        <span style={styles.orderIdText}>Order #{order.id?.slice(0, 8).toUpperCase()}</span>
                        <span style={{
                          ...styles.statusPill,
                          background: statusColor(order.status).bg,
                          color: statusColor(order.status).color
                        }}>{order.status}</span>
                      </div>
                      
                      <div style={styles.timeline}>
                        {getOrderStatusTimeline(order.status).map((step, i) => (
                          <div key={i} style={styles.timelineStep}>
                            <div style={{
                              ...styles.timelineDot,
                              background: step.completed ? "#FF6B35" : "#e5e7eb",
                              boxShadow: step.active ? "0 0 0 4px #fff4f0" : "none"
                            }} />
                            <span style={{
                              ...styles.timelineLabel,
                              color: step.completed ? "#1a1a1a" : "#9ca3af",
                              fontWeight: step.active ? "600" : "400"
                            }}>{step.label}</span>
                          </div>
                        ))}
                      </div>

                      {order.deliveryAddress && (
                        <div style={styles.activityAddress}>
                          📍 {order.deliveryAddress}
                        </div>
                      )}

                      <div style={styles.activityPayment}>
                        {order.paymentMethod === "cash_on_delivery" ? "💵 Cash on Delivery" : 
                         order.paymentMethod === "gcash" ? "📱 GCash" : 
                         order.paymentMethod === "maya" ? "💳 Maya" : "💰 " + order.paymentMethod}
                      </div>

                      <div style={styles.activityCardFooter}>
                        <span style={styles.priceText}>₱{order.totalAmount?.toFixed(2)}</span>
                        <button onClick={() => setActiveTab("orders")} style={styles.detailsBtn}>View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Past Orders Section */}
            <section style={styles.activitySection}>
              <h2 style={styles.sectionTitle}>Past Orders</h2>
              {orders.length === 0 ? (
                <p style={styles.emptyText}>No orders yet.</p>
              ) : (
                <div style={styles.pastOrdersList}>
                  {orders.slice(0, 10).map(order => (
                    <div key={order.id} style={styles.pastOrderRow}>
                      <div style={styles.pastOrderInfo}>
                        <span style={styles.pastOrderDate}>
                          {new Date(order.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                        </span>
                        <span style={styles.pastOrderId}>#{order.id?.slice(0, 8).toUpperCase()}</span>
                        <span style={{
                          ...styles.statusPill,
                          background: statusColor(order.status).bg,
                          color: statusColor(order.status).color,
                          fontSize: '10px',
                          padding: '2px 6px'
                        }}>{order.status}</span>
                        <span style={styles.pastOrderAmount}>₱{order.totalAmount?.toFixed(2)}</span>
                      </div>
                      <button 
                        onClick={() => handleReorder(order)} 
                        style={styles.reorderBtn}
                      >
                        🔄 Reorder
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
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
                    {item.restaurantName && (
                      <div style={styles.menuRestaurantName}>
                        🏪 {item.restaurantName}
                      </div>
                    )}
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
                      <div style={styles.menuButtonGroup}>
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
                        <button
                          onClick={() => handleOrderNow(item)}
                          disabled={!item.availability}
                          style={{
                            ...styles.orderBtn,
                            opacity: item.availability ? 1 : 0.4,
                            cursor: item.availability ? "pointer" : "not-allowed",
                          }}
                        >
                          Order Now
                        </button>
                      </div>
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
                  <button style={styles.checkoutBtn} onClick={openCheckoutModal}>
                    Place Order →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {addToCartModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
              <div style={styles.modalHeader}>
                <div>
                  <h2 style={styles.modalTitle}>Add to cart</h2>
                  <p style={styles.modalSubtitle}>{itemToAdd?.name}</p>
                </div>
                <button style={styles.modalCloseBtn} onClick={handleCloseAddModal}>✕</button>
              </div>

              <div style={styles.modalBody}>
                <p style={{ color: "#555", margin: 0 }}>{itemToAdd?.description || "No description available."}</p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                  <div style={{ fontWeight: 700, color: "#FF6B35" }}>₱{itemToAdd?.price?.toFixed(2)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => setAddQty(Math.max(1, addQty - 1))} style={styles.qtyBtnModal}>−</button>
                    <span style={styles.qtyNumModal}>{addQty}</span>
                    <button onClick={() => setAddQty(addQty + 1)} style={styles.qtyBtnModal}>+</button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, padding: "16px", justifyContent: "flex-end" }}>
                <button style={styles.confirmBtn} onClick={handleConfirmAddToCart}>Add to cart</button>
                <button style={styles.cancelBtn} onClick={handleCloseAddModal}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Modal (Customer) */}
        {showProfileModal && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: "520px" }}>
              <div style={styles.modalBody}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <h3 style={styles.modalTitle}>Your Profile</h3>
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

        {checkoutOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
              {checkoutStep === 1 ? (
                <div>
                  <div style={styles.modalHeader}>
                    <div>
                      <h2 style={styles.modalTitle}>{restaurantName}</h2>
                      <p style={styles.modalSubtitle}>{restaurantLocation}</p>
                      <p style={styles.modalDelivery}>Estimated delivery: {estimatedDelivery}</p>
                    </div>
                    <button style={styles.modalCloseBtn} onClick={closeCheckoutModal}>✕</button>
                  </div>

                  <div style={styles.modalBody}>
                    {visibleCheckoutItems.length === 0 ? (
                      <p style={styles.emptyOrderText}>Your cart is empty. Add items to review your order.</p>
                    ) : (
                      <div style={styles.modalGrid}>
                        {visibleCheckoutItems.map((item) => (
                          <div key={item.id} style={styles.modalItem}>
                            <div style={styles.itemEmoji}>{item.emoji || "🍽️"}</div>
                            <div style={styles.itemDetails}>
                              <p style={styles.itemName}>{item.name}</p>
                              <p style={styles.itemDesc}>{item.description || "No description available."}</p>
                              <p style={styles.itemPrice}>₱{item.price?.toFixed(2)}</p>
                            </div>
                            <div style={styles.qtyControlsModal}>
                              <button
                                style={styles.qtyBtnModal}
                                onClick={() => handleQuantityChange(item.id, -1)}
                              >
                                −
                              </button>
                              <span style={styles.qtyNumModal}>{item.quantity}</span>
                              <button
                                style={styles.qtyBtnModal}
                                onClick={() => handleQuantityChange(item.id, 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={styles.modalFooter}>
                    <div style={styles.modalSummary}>
                      <span>{checkoutItemCount} item{checkoutItemCount !== 1 ? "s" : ""}</span>
                      <strong>₱{checkoutTotal.toFixed(2)}</strong>
                    </div>
                    <button
                      style={styles.secondaryBtn}
                      onClick={handleProceedToReview}
                      disabled={visibleCheckoutItems.length === 0}
                    >
                      Review order
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={styles.modalHeader}>
                    <div>
                      <h2 style={styles.modalTitle}>Review your order</h2>
                      <p style={styles.modalSubtitle}>{restaurantName} · {restaurantLocation}</p>
                    </div>
                    <button style={styles.modalCloseBtn} onClick={closeCheckoutModal}>✕</button>
                  </div>

                  <div style={styles.modalBody}>
                    {visibleCheckoutItems.length === 0 ? (
                      <p style={styles.emptyOrderText}>Add at least one item to continue.</p>
                    ) : (
                      <>
                        <div style={styles.reviewList}>
                          {visibleCheckoutItems.map((item) => (
                            <div key={item.id} style={styles.reviewItem}>
                              <div>
                                <p style={styles.itemName}>{item.name}</p>
                                <p style={styles.itemDesc}>Qty {item.quantity} · ₱{item.price?.toFixed(2)} each</p>
                              </div>
                              <strong>₱{(item.price * item.quantity).toFixed(2)}</strong>
                            </div>
                          ))}
                        </div>

                        <div style={styles.addressSection}>
                          <label style={styles.label}>Delivery Address:</label>
                          <textarea
                            placeholder="Enter your complete delivery address (Street, Brgy, City)"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            style={styles.addressInput}
                            required
                          />
                        </div>

                        <div style={styles.paymentSection}>
                          <label style={styles.paymentLabel}>Select Payment Method:</label>
                          <div style={styles.paymentOptions}>
                            {[
                              { id: "gcash", label: "GCash", icon: "📱" },
                              { id: "maya", label: "Maya", icon: "💳" },
                              { id: "cash_on_delivery", label: "Cash on Delivery", icon: "💵" },
                            ].map((method) => (
                              <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                style={{
                                  ...styles.paymentOption,
                                  background: paymentMethod === method.id ? "#fff4f0" : "white",
                                  border: paymentMethod === method.id ? "2px solid #FF6B35" : "1px solid #ececec",
                                }}
                              >
                                <span style={{ fontSize: "24px", marginBottom: "6px" }}>{method.icon}</span>
                                <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a" }}>{method.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {(paymentMethod === "gcash" || paymentMethod === "maya") && (
                          <div style={styles.paymentRefSection}>
                            <label style={styles.refLabel}>
                              {paymentMethod === "gcash" ? "GCash" : "Maya"} Mobile Number
                            </label>
                            <input
                              type="text"
                              placeholder="Enter 11-digit number"
                              value={paymentReference}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 11);
                                setPaymentReference(value);
                              }}
                              maxLength="11"
                              style={styles.refInput}
                            />
                            <p style={styles.refHint}>
                              {paymentReference.length}/11 digits
                            </p>
                          </div>
                        )}

                        <div style={styles.reviewBreakdown}>
                          <div style={styles.breakdownRow}>
                            <span>Subtotal</span>
                            <span>₱{checkoutSubtotal.toFixed(2)}</span>
                          </div>
                          <div style={styles.breakdownRow}>
                            <span>Delivery fee</span>
                            <span>₱{deliveryFee.toFixed(2)}</span>
                          </div>
                          <div style={styles.breakdownRowTotal}>
                            <span>Total</span>
                            <strong>₱{checkoutTotal.toFixed(2)}</strong>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div style={styles.reviewActions}>
                    <button 
                      style={styles.confirmBtn} 
                      onClick={handleConfirmPay} 
                      disabled={visibleCheckoutItems.length === 0 || ((paymentMethod === "gcash" || paymentMethod === "maya") && paymentReference.length !== 11)}
                    >
                      Confirm & Pay
                    </button>
                    <button style={styles.cancelBtn} onClick={closeCheckoutModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>{["Order ID", "Customer", "Address", "Payment", "Total", "Status", "Date"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={7} style={styles.emptyCell}>You haven't placed any orders yet.</td></tr>
                ) : orders.map((o) => {
                  const sc = statusColor(o.status);
                  return (
                    <tr key={o.id} style={styles.tr}>
                      <td style={styles.td}><span style={{ fontFamily: "monospace", fontWeight: "700" }}>#{o.id?.slice(0, 8).toUpperCase()}</span></td>
                      <td style={styles.td}>{o.user?.email || user?.sub || "You"}</td>
                      <td style={styles.td}>{o.deliveryAddress || "—"}</td>
                      <td style={styles.td}>
                        <span style={styles.paymentPill}>
                          {o.paymentMethod === "cash_on_delivery" ? "💵 Cash" : 
                           o.paymentMethod === "gcash" ? "📱 GCash" : 
                           o.paymentMethod === "maya" ? "💳 Maya" : o.paymentMethod || "—"}
                        </span>
                      </td>
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
  successBanner: {
    marginTop: "12px",
    padding: "10px 14px",
    background: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    fontWeight: "600",
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
  cardActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  favoriteBtn: {
    background: "#fff",
    border: "1px solid #ececec",
    borderRadius: "8px",
    width: "40px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "20px",
    transition: "all 0.2s ease",
    padding: 0,
    outline: "none",
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
    flex: 1,
    height: "36px",
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
  menuRestaurantName: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#FF6B35",
    background: "#fff4f0",
    padding: "2px 8px",
    borderRadius: "4px",
    alignSelf: "flex-start",
    marginBottom: "2px",
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
  menuButtonGroup: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  orderBtn: {
    background: "white",
    color: "#FF6B35",
    border: "1.5px solid #FF6B35",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
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
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: "20px",
  },
  modalBox: {
    width: "100%",
    maxWidth: "560px",
    background: "white",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.18)",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    padding: "24px",
    borderBottom: "1px solid #f3f4f6",
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "700",
    margin: 0,
    color: "#111827",
  },
  modalSubtitle: {
    margin: "8px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  modalDelivery: {
    margin: "12px 0 0",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "600",
  },
  modalCloseBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    background: "white",
    color: "#374151",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "700",
  },
  modalBody: {
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  modalGrid: {
    display: "grid",
    gap: "16px",
  },
  modalContent: { width: "100%", maxWidth: "520px", background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 40px 120px rgba(15, 23, 42, 0.12)" },
  modalLabel: { display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#374151" },
  modalInput: { width: "100%", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "#111827", marginBottom: "14px" },
  modalRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" },
  modalField: { display: "flex", flexDirection: "column" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "14px" },
  primaryBtn: { background: "#FF6B35", color: "white", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", fontWeight: "700" },
  secondaryBtn: { background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", fontWeight: "700" },
  modalItem: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    gap: "16px",
    alignItems: "center",
    background: "#f8fafc",
    borderRadius: "18px",
    padding: "16px",
  },
  itemEmoji: {
    fontSize: "26px",
    width: "42px",
    height: "42px",
    display: "grid",
    placeItems: "center",
    borderRadius: "14px",
    background: "#fff1f0",
  },
  itemDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  itemName: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700",
    color: "#111827",
  },
  itemDesc: {
    margin: 0,
    fontSize: "13px",
    color: "#6b7280",
  },
  itemPrice: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    color: "#FF6B35",
  },
  qtyControlsModal: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  qtyBtnModal: {
    width: "34px",
    height: "34px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
    color: "#FF6B35",
    fontSize: "18px",
    fontWeight: "700",
  },
  qtyNumModal: {
    minWidth: "24px",
    textAlign: "center",
    fontWeight: "700",
    color: "#111827",
  },
  modalFooter: {
    padding: "20px 24px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    borderTop: "1px solid #f3f4f6",
  },
  modalSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "15px",
    color: "#111827",
  },
  secondaryBtn: {
    background: "#FF6B35",
    color: "white",
    border: "none",
    borderRadius: "999px",
    padding: "14px 20px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  reviewList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  reviewItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#f8fafc",
    fontSize: "14px",
    color: "#111827",
  },
  reviewTotal: {
    marginTop: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "700",
    fontSize: "16px",
    color: "#111827",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#f3f4f6",
  },
  paymentSection: {
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "16px",
    marginBottom: "16px",
  },
  paymentLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#6b7280",
    display: "block",
    marginBottom: "12px",
  },
  paymentOptions: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  paymentOption: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px 12px",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  paymentRefSection: {
    padding: "16px",
    background: "#fff4f0",
    borderRadius: "12px",
    marginBottom: "16px",
    border: "1px solid #ffe0cc",
  },
  refLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#FF6B35",
    display: "block",
    marginBottom: "8px",
  },
  refInput: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #ececec",
    borderRadius: "8px",
    fontWeight: "600",
    letterSpacing: "2px",
    boxSizing: "border-box",
    outline: "none",
  },
  refHint: {
    fontSize: "12px",
    color: "#888",
    margin: "6px 0 0",
    textAlign: "right",
  },
  reviewBreakdown: {
    display: "grid",
    gap: "10px",
    padding: "14px",
    borderRadius: "16px",
    background: "#f8fafc",
  },
  breakdownRow: {
    display: "flex",
    justifyContent: "space-between",
    color: "#6b7280",
    fontSize: "14px",
  },
  breakdownRowTotal: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
  },
  reviewActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    padding: "0 24px 24px",
  },
  confirmBtn: {
    flex: 1,
    minWidth: "160px",
    background: "#111827",
    color: "white",
    border: "none",
    borderRadius: "999px",
    padding: "14px 20px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  cancelBtn: {
    flex: 1,
    minWidth: "160px",
    background: "transparent",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    borderRadius: "999px",
    padding: "14px 20px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  emptyOrderText: {
    color: "#6b7280",
    fontSize: "14px",
    textAlign: "center",
    padding: "16px 0",
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
  orderItems: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "10px",
  },
  orderItemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    borderRadius: "12px",
    background: "#f8fafc",
  },
  orderItemName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
  },
  orderItemMeta: {
    margin: 0,
    fontSize: "12px",
    color: "#6b7280",
  },
  orderItemTotal: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    minWidth: "80px",
    textAlign: "right",
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
  filterBar: {
    display: "flex",
    gap: "12px",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    minWidth: "200px",
    padding: "12px 16px",
    border: "1px solid #ececec",
    borderRadius: "999px",
    fontSize: "14px",
    background: "white",
    outline: "none",
    transition: "border-color 0.2s",
  },
  filterSelect: {
    padding: "12px 16px",
    border: "1px solid #ececec",
    borderRadius: "999px",
    fontSize: "14px",
    background: "white",
    cursor: "pointer",
    outline: "none",
    minWidth: "150px",
    transition: "border-color 0.2s",
  },
  tableWrapper: { background: "white", borderRadius: "14px", border: "1px solid #ececec", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#aaa", textAlign: "left", background: "#fafafa", borderBottom: "1px solid #f0f0f0" },
  tr: { borderBottom: "1px solid #f9f9f9" },
  td: { padding: "12px 16px", fontSize: "13px", color: "#333" },
  emptyCell: { padding: "3rem", textAlign: "center", color: "#aaa", fontSize: "14px" },
  pill: { fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "999px" },
  paymentPill: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "3px 8px",
    borderRadius: "6px",
    display: "inline-block",
  },
  
  // Address Styles
  addressSection: {
    marginBottom: "20px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    display: "block",
    marginBottom: "4px",
  },
  addressInput: {
    width: "100%",
    minHeight: "80px",
    padding: "12px",
    border: "1px solid #ececec",
    borderRadius: "12px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    marginTop: "4px",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },

  // Activity Tab Styles
  activityContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  activitySection: {
    background: "white",
    padding: "1.5rem",
    borderRadius: "16px",
    border: "1px solid #ececec",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: "1.25rem",
    margin: 0,
  },
  activityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1rem",
  },
  activityCard: {
    background: "#f8fafc",
    padding: "1.25rem",
    borderRadius: "12px",
    border: "1px solid #f1f5f9",
  },
  activityCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem",
  },
  orderIdText: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#64748b",
  },
  timeline: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
    position: "relative",
    padding: "0 10px",
  },
  timelineStep: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    zIndex: 1,
  },
  timelineDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    transition: "all 0.3s ease",
  },
  timelineLabel: {
    fontSize: "10px",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  activityAddress: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "8px",
  },
  activityPayment: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "12px",
    fontWeight: "500",
  },
  activityCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "1rem",
  },
  priceText: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#FF6B35",
  },
  detailsBtn: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  pastOrdersList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  pastOrderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1rem",
    background: "#f8fafc",
    borderRadius: "10px",
  },
  pastOrderInfo: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "center",
  },
  pastOrderDate: {
    fontSize: "13px",
    color: "#64748b",
    minWidth: "60px",
  },
  pastOrderId: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1e293b",
    minWidth: "80px",
  },
  pastOrderAmount: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#FF6B35",
  },
  reorderBtn: {
    background: "#FF6B35",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.1s",
  },
  cartNotification: {
    position: "fixed",
    bottom: "30px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#111827",
    color: "white",
    borderRadius: "12px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  emptyText: {
    fontSize: "14px",
    color: "#94a3b8",
    textAlign: "center",
    padding: "1rem 0",
  },
};