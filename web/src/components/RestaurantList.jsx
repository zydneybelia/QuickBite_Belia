import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8086/api";

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/customer/restaurants`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.restaurants || [];

      setRestaurants(data);
    } catch (err) {
      console.error("Failed to load restaurants", err);
      setError("Unable to load restaurants. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openMenu = (restaurantId) => {
    navigate(`/restaurants/${restaurantId}`);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2>Restaurants</h2>
        <p>Browse available restaurants and view their menus.</p>
      </div>

      {loading && <p style={styles.statusText}>Loading restaurants...</p>}
      {error && <p style={{ ...styles.statusText, color: "#d14343" }}>{error}</p>}

      {!loading && !error && restaurants.length === 0 && (
        <p style={styles.statusText}>No active restaurants available right now.</p>
      )}

      <div style={styles.grid}>
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} style={styles.card} onClick={() => openMenu(restaurant.id)}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>{restaurant.name}</h3>
              <span style={styles.cardBadge}>{restaurant.category || "Cuisine"}</span>
            </div>
            <p style={styles.cardText}>{restaurant.description || "No description available."}</p>
            <div style={styles.cardMeta}>
              <div>
                <span style={styles.metaLabel}>Location:</span> {restaurant.location || "Unknown"}
              </div>
              <div>
                <span style={styles.metaLabel}>Rating:</span> {restaurant.rating ?? "N/A"}
              </div>
            </div>
            <button type="button" style={styles.viewBtn}>View Menu</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "18px",
  },
  statusText: {
    color: "#555",
    fontSize: "16px",
    marginBottom: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },
  card: {
    cursor: "pointer",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "20px",
    background: "#fff",
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "20px",
    lineHeight: 1.2,
  },
  cardBadge: {
    background: "#f8fafc",
    color: "#111827",
    borderRadius: "999px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 600,
  },
  cardText: {
    color: "#4b5563",
    fontSize: "14px",
    minHeight: "56px",
    marginBottom: "18px",
  },
  cardMeta: {
    display: "grid",
    gap: "8px",
    marginBottom: "18px",
    color: "#374151",
    fontSize: "14px",
  },
  metaLabel: {
    fontWeight: 600,
  },
  viewBtn: {
    background: "#f97316",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  },
};
