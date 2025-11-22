import apiClient from "./apiClient.js";

export async function fetchInventory(params = {}) {
  const { data } = await apiClient.get("/me/inventory", { params });
  return data;
}

export async function sellInventoryItems(payload = {}) {
  const { data } = await apiClient.post("/me/inventory/sell", payload);
  return data;
}