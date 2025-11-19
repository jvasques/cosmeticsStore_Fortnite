import env from "../config/env.js";

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

export async function fetchFortniteCosmetics() {
  const response = await fetch(env.fortniteApiUrl);

  if (!response.ok) {
    throw new Error(`Fortnite API retornou status ${response.status}`);
  }

  const payload = await response.json();
  const entries = extractEntries(payload?.data);

  if (!entries.length) {
    throw new Error("Resposta inesperada da Fortnite API");
  }

  return entries.map((item) => item?.br ?? item).filter(Boolean);
}
