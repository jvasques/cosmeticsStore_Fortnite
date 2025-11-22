import apiClient from "./apiClient.js";

export async function fetchPublicUsers(params = {}) {
  const query = {};

  if (params.page !== undefined) {
    query.page = params.page;
  }

  if (params.limit !== undefined) {
    query.limit = params.limit;
  }

  if (params.sort) {
    query.sort = params.sort;
  }

  const { data } = await apiClient.get("/users", Object.keys(query).length ? { params: query } : undefined);
  return data;
}

export async function fetchPublicProfile(id) {
  const { data } = await apiClient.get(`/users/${id}`);
  return data;
}