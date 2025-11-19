import apiClient from "./apiClient.js";

export async function fetchShopEntries(params = {}) {
  const { data } = await apiClient.get("/shop/entries", { params });
  return data;
}