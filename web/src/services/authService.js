import axios from "axios";

export const BASE_API_URL = "http://localhost:8086/api";
export const AUTH_API_URL = `${BASE_API_URL}/auth`;
export const OAUTH2_AUTH_URL = "http://localhost:8086/oauth2/authorization/google";

export const registerUser = async (data) => {
  return await axios.post(`${AUTH_API_URL}/register`, data);
};

export const loginUser = async (data) => {
  return await axios.post(`${AUTH_API_URL}/login`, data);
};