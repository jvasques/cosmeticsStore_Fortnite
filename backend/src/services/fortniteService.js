import env from "../config/env.js";

async function fetchJson(url, label) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${label} retornou status ${response.status}`);
  }

  return response.json();
}

function extractEntries(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.br)) {
    return data.br;
  }

  if (data && typeof data === "object") {
    const aggregated = [];
    for (const value of Object.values(data)) {
      if (Array.isArray(value)) {
        aggregated.push(...value);
      }
    }
    return aggregated;
  }

  return [];
}

function extractBrItems(itemsContainer) {
  if (Array.isArray(itemsContainer?.br)) {
    return itemsContainer.br;
  }

  if (Array.isArray(itemsContainer)) {
    return itemsContainer;
  }

  if (itemsContainer && typeof itemsContainer === "object") {
    const candidate = itemsContainer.br ?? Object.values(itemsContainer).find(Array.isArray);
    return Array.isArray(candidate) ? candidate : [];
  }

  return [];
}

export async function fetchFortniteCosmetics() {
  const payload = await fetchJson(env.fortniteApiUrl, "Fortnite API");
  const entries = extractEntries(payload?.data);

  if (!entries.length) {
    throw new Error("Resposta inesperada da Fortnite API");
  }

  return entries.map((item) => item?.br ?? item).filter(Boolean);
}

export async function fetchFortniteNewCosmetics() {
  const payload = await fetchJson(env.fortniteApiNewUrl, "Fortnite API (novos)");
  const entries = extractBrItems(payload?.data?.items);

  if (!entries.length) {
    throw new Error("Resposta inesperada ao buscar cosméticos novos");
  }

  return entries;
}

export async function fetchFortniteShopEntries() {
  const payload = await fetchJson(env.fortniteShopUrl, "Fortnite API (loja)");
  const entries = Array.isArray(payload?.data?.entries) ? payload.data.entries : [];

  if (!entries.length) {
    throw new Error("Resposta inesperada ao buscar itens da loja");
  }

  return entries;
}