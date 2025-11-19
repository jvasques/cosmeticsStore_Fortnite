import apiClient from "./apiClient.js";

export async function fetchCosmetics(params = {}) {
  const { data } = await apiClient.get("/cosmetics", { params });
  return data;
}

export async function fetchNewCosmetics(params = {}) {
  const { data } = await apiClient.get("/cosmetics/new", { params });
  return data;
}