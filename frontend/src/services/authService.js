import apiClient from "./apiClient.js";

export async function registerUser(payload) {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
}

export async function loginUser(payload) {
  const { data } = await apiClient.post("/auth/login", payload);
  return data;
}

export async function fetchProfile() {
  const { data } = await apiClient.get("/me");
  return data;
}

export async function fetchWallet(params = {}) {
  const { data } = await apiClient.get("/me/wallet", { params });
  return data;
}