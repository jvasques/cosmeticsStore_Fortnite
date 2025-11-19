import apiClient from "./apiClient.js";

export async function fetchPublicUsers() {
  const { data } = await apiClient.get("/users");
  return data;
}

export async function fetchPublicProfile(id) {
  const { data } = await apiClient.get(`/users/${id}`);
  return data;
}