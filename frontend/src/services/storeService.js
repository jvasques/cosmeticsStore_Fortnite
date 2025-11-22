import apiClient from "./apiClient.js";

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeMetadata(base = {}, entry = {}, extra = {}) {
  return {
    ...base,
    itemName: entry.name ?? entry.bundleName ?? entry.id ?? entry.offerId,
    itemId: entry.id ?? null,
    offerId: entry.offerId ?? entry.offer_id ?? null,
    itemType: entry.type ?? (entry.bundleName ? "bundle" : "item"),
    ...extra,
  };
}

export async function purchaseItems(payload = {}) {
  const entries = ensureArray(payload.items).filter((entry) => entry && (entry.offerId ?? entry.offer_id));
  if (!entries.length) {
    return { order: null };
  }

  const currency = payload.currency ?? "VB";
  const baseMetadata = {
    source: payload.metadata?.source ?? "frontend",
    cartSize: entries.length,
    ...payload.metadata,
  };

  const responses = [];

  for (const entry of entries) {
    const body = {
      offerId: entry.offerId ?? entry.offer_id,
      quantity: entry.quantity ?? 1,
      currency,
      metadata: normalizeMetadata(baseMetadata, entry),
    };

    const { data } = await apiClient.post("/me/shop/purchase", body);
    responses.push(data?.order ?? data ?? null);
  }

  const aggregatedTotal = responses.reduce((total, order, index) => {
    if (order?.total !== undefined && order?.total !== null) {
      return total + Number(order.total) || total;
    }
    const entry = entries[index];
    const value = entry?.finalPrice ?? entry?.final_price ?? entry?.regularPrice ?? entry?.regular_price ?? 0;
    return total + Number(value || 0);
  }, 0);

  const aggregatedTotalValue = Number.isFinite(aggregatedTotal) ? aggregatedTotal : null;

  const aggregatedOrder = {
    id: responses.at(-1)?.id ?? `checkout-${Date.now()}`,
    currency,
    total: aggregatedTotalValue ?? payload.total ?? null,
    items: entries,
    entries: responses,
    simulated: responses.some((order) => Boolean(order?.simulated)),
  };

  return {
    order: aggregatedOrder,
    warning: null,
  };
}