import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8086/api";

export default function RestaurantMenu() {
  const { restaurantId } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (restaurantId) {
      fetchMenuItems();
    }
  }, [restaurantId]);

  const fetchMenuItems = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API_URL}/restaurants/${restaurantId}/menu`);
      const data = Array.isArray(response.data) ? response.data : [];
      setMenuItems(data);
    } catch (err) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.message || err.response?.data || err.message;
      console.error(`[${status}] Failed to load menu items from restaurant ${restaurantId}:`, errorMsg);
      
      // Provide helpful error messages
      if (status === 404) {
        setError("Restaurant not found.");
      } else if (status === 400) {
        setError("This restaurant is temporarily unavailable. Please try again later.");
      } else {
        setError("Unable to load menu items. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    alert(`Added "${item.name}" to cart.`);
  };

  return (
    <div style={styles.page}>
      <div style={styles.toolbar}>
        <button type="button" onClick={() => navigate(-1)} style={styles.backButton}>
          ← Back to restaurants
        </button>
        <Link to="/restaurants" style={styles.linkButton}>Browse restaurants</Link>
      </div>

      <div style={styles.header}>
        <h2>Restaurant Menu</h2>
        <p>Explore the available dishes and add favorites to your cart.</p>
      </div>

      {loading && <p style={styles.statusText}>Loading menu...</p>}
      {error && <p style={{ ...styles.statusText, color: "#d14343" }}>{error}</p>}

      {!loading && !error && menuItems.length === 0 && (
        <p style={styles.statusText}>No menu items found for this restaurant.</p>
      )}

      <div style={styles.menuGrid}>
        {menuItems.map((item) => (
          <div key={item.id} style={styles.menuCard}>
            <div>
              <div style={styles.menuHeader}>
                <div>
                  <h3 style={styles.menuTitle}>{item.name}</h3>
                  <p style={styles.menuCategory}>{item.category || "General"}</p>
                </div>
                <span style={styles.price}>₱{item.price?.toFixed(2)}</span>
              </div>
              <p style={styles.menuDescription}>{item.description || "No description provided."}</p>
            </div>
            <button type="button" onClick={() => addToCart(item)} style={styles.addButton}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    gap: "12px",
    flexWrap: "wrap",
  },
  backButton: {
    background: "transparent",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    color: "#111827",
    padding: "10px 16px",
    cursor: "pointer",
  },
  linkButton: {
    textDecoration: "none",
    background: "#f97316",
    color: "white",
    borderRadius: "10px",
    padding: "10px 16px",
    fontWeight: 600,
  },
  header: {
    marginBottom: "18px",
  },
  statusText: {
    color: "#555",
    fontSize: "16px",
    marginBottom: "20px",
  },
  menuGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  menuCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "20px",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "180px",
  },
  menuHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  menuTitle: {
    margin: 0,
    fontSize: "18px",
  },
  price: {
    fontWeight: 700,
    color: "#111827",
  },
  menuDescription: {
    color: "#4b5563",
    fontSize: "14px",
    lineHeight: 1.6,
    marginBottom: "16px",
  },
  menuCategory: {
    fontSize: "12px",
    color: "#9ca3af",
    margin: "2px 0 0",
  },
  addButton: {
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "14px",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
};
