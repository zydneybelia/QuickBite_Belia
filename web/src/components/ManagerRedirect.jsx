import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_API_URL } from "../services/authService";

export default function ManagerRedirect() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const fetchAssigned = async () => {
      try {
        const res = await axios.get(`${BASE_API_URL}/manager/assigned-restaurant`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const assigned = res.data;
        console.debug('ManagerRedirect: assigned response', assigned);
        if (assigned?.restaurantId) {
          navigate(`/manager/restaurant/${assigned.restaurantId}`);
        } else {
          navigate('/manager/waiting');
        }
      } catch (err) {
        if (err.response?.status === 404) {
          navigate('/manager/waiting');
        } else {
          console.error('Failed to resolve manager assignment', err);
          navigate('/manager/waiting');
        }
      }
    };
    fetchAssigned();
  }, [navigate, token]);

  return null;
}
