import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { fetchInventory } from "../services/inventoryService.js";
import { useAuthStore } from "./authStore.js";

const pickFirstValue = (...candidates) => {
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed;
      }
      continue;
    }
    return candidate;
  }
  return null;
};

const extractBundleInfo = (item = {}) => {
  const bundlePayload =
    item.bundle ??
    item.bundle_info ??
    item.bundleInfo ??
    item.bundle_data ??
    item.bundleData ??
    item.purchase?.bundle ??
    item.purchase?.bundleInfo ??
    item.purchase?.bundle_info ??
    item.order?.bundle ??
    item.order?.bundleInfo ??
    item.metadata?.bundle ??
    item.metadata?.purchase?.bundle ??
    null;

  const bundleId = pickFirstValue(
    item.bundleId,
    item.bundle_id,
    item.bundleEntryId,
    item.bundle_entry_id,
    item.bundleOfferId,
    item.bundle_offer_id,
    item.bundlePurchaseId,
    item.bundle_purchase_id,
    item.purchase?.bundleId,
    item.purchase?.bundle_id,
    item.purchase?.bundleOfferId,
    item.purchase?.bundle_offer_id,
    item.order?.bundleId,
    item.order?.bundle_id,
    item.order?.bundleOfferId,
    item.order?.bundle_offer_id,
    item.metadata?.bundleId,
    item.metadata?.bundle_id,
    item.metadata?.bundleOfferId,
    item.metadata?.bundle_offer_id,
    item.metadata?.purchase?.bundleId,
    item.metadata?.purchase?.bundle_id,
    bundlePayload?.id,
    bundlePayload?.bundleId,
    bundlePayload?.bundle_id,
  );

  const bundleName = pickFirstValue(
    item.bundleName,
    item.bundle_name,
    item.bundleTitle,
    item.bundle_title,
    item.purchase?.bundleName,
    item.purchase?.bundle_name,
    item.purchase?.bundleTitle,
    item.order?.bundleName,
    item.order?.bundle_name,
    bundlePayload?.name,
    bundlePayload?.bundleName,
    bundlePayload?.bundle_name,
    bundlePayload?.title,
    bundlePayload?.displayName,
    item.metadata?.bundleName,
    item.metadata?.bundle_name,
    item.metadata?.purchase?.bundleName,
    item.metadata?.purchase?.bundle_name,
  );

  return { bundleId, bundleName };
};

const fallbackSourceLabel = (item = {}) => item.source ?? item.origin ?? item.metadata?.source ?? "Loja";

const normalizeInventoryItem = (raw = {}) => {
  const metadata = raw.metadata ?? {};
  const { bundleId, bundleName } = extractBundleInfo(raw);
  const offerId = pickFirstValue(
    raw.offerId,
    raw.offer_id,
    metadata.offerId,
    metadata.offer_id,
    raw.bundleOfferId,
    raw.bundle_offer_id,
    metadata.bundleOfferId,
    metadata.bundle_offer_id,
    raw.purchase?.offerId,
    raw.purchase?.offer_id,
    metadata.purchase?.offerId,
    metadata.purchase?.offer_id,
  );
  const explicitBundleOrigin =
    pickFirstValue(
      raw.originType,
      raw.origin_type,
      raw.sourceType,
      raw.source_type,
      metadata.originType,
      metadata.origin_type,
      metadata.sourceType,
      metadata.source_type,
      raw.origin,
      raw.source,
    )?.toLowerCase?.() === "bundle";

  const isBundleItem = Boolean(bundleId) || explicitBundleOrigin;
  const bundleLabel = bundleName ? `Bundle · ${bundleName}` : "Bundle";
  const sourceLabel = isBundleItem ? bundleLabel : fallbackSourceLabel(raw);

  return {
    ...raw,
    source: sourceLabel,
    origin: isBundleItem ? "bundle" : raw.origin,
    metadata: {
      ...metadata,
      source: sourceLabel,
      bundleId: bundleId ?? metadata.bundleId ?? metadata.bundle_id ?? null,
      bundle_id: bundleId ?? metadata.bundle_id ?? null,
      bundleName: bundleName ?? metadata.bundleName ?? metadata.bundle_name ?? null,
      bundle_name: bundleName ?? metadata.bundle_name ?? null,
      originType: isBundleItem ? "bundle" : metadata.originType ?? metadata.sourceType ?? null,
      offerId: offerId ?? metadata.offerId ?? metadata.offer_id ?? null,
      offer_id: offerId ?? metadata.offer_id ?? null,
      purchase: {
        ...(metadata.purchase ?? {}),
        offerId: offerId ?? metadata.purchase?.offerId ?? metadata.purchase?.offer_id ?? null,
      },
    },
    offerId: offerId ?? raw.offerId ?? raw.offer_id ?? null,
  };
};

const resolveInventoryCosmeticKey = (item = {}) =>
  pickFirstValue(
    item.cosmeticId,
    item.cosmetic_id,
    item.itemId,
    item.item_id,
    item.templateId,
    item.template_id,
    item.id,
  );

const resolveInventoryEntryKey = (item = {}) =>
  pickFirstValue(
    item.inventoryId,
    item.inventory_id,
    item.userCosmeticId,
    item.user_cosmetic_id,
    item.userItemId,
    item.user_item_id,
    item.id,
    item.cosmeticId,
    item.cosmetic_id,
  );

const resolveInventoryOfferKey = (item = {}) =>
  pickFirstValue(
    item.offerId,
    item.offer_id,
    item.metadata?.offerId,
    item.metadata?.offer_id,
    item.metadata?.purchase?.offerId,
    item.metadata?.purchase?.offer_id,
    item.purchase?.offerId,
    item.purchase?.offer_id,
    item.bundleOfferId,
    item.bundle_offer_id,
  );

const resolveInventoryBundleKey = (item = {}) =>
  pickFirstValue(
    item.bundleId,
    item.bundle_id,
    item.metadata?.bundleId,
    item.metadata?.bundle_id,
    item.bundleOfferId,
    item.bundle_offer_id,
    item.offerId,
    item.offer_id,
    item.metadata?.offerId,
    item.metadata?.offer_id,
    item.purchase?.bundleId,
    item.purchase?.bundle_id,
    item.purchase?.bundleOfferId,
    item.purchase?.bundle_offer_id,
    item.purchase?.offerId,
    item.purchase?.offer_id,
  );

const resolveCosmeticCandidateKey = (candidate) => {
  if (!candidate) {
    return null;
  }
  if (typeof candidate === "string" || typeof candidate === "number") {
    return candidate;
  }
  return pickFirstValue(
    candidate.cosmeticId,
    candidate.cosmetic_id,
    candidate.id,
    candidate.itemId,
    candidate.item_id,
    candidate.templateId,
    candidate.template_id,
  );
};

const resolveBundleCandidateKey = (candidate) => {
  if (!candidate) {
    return null;
  }
  if (typeof candidate === "string" || typeof candidate === "number") {
    return candidate;
  }
  return pickFirstValue(
    candidate.bundleId,
    candidate.bundle_id,
    candidate.offerId,
    candidate.offer_id,
    candidate.bundleOfferId,
    candidate.bundle_offer_id,
  );
};

export const useInventoryStore = defineStore("inventory", () => {
  const authStore = useAuthStore();
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const initialized = ref(false);

  async function load(options = {}) {
    if (!authStore.isAuthenticated) {
      items.value = [];
      initialized.value = false;
      return;
    }
    if (loading.value && !options.force) {
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      const response = await fetchInventory({ limit: options.limit ?? 250 });
      const list = Array.isArray(response?.items) ? response.items : [];
      items.value = list.map(normalizeInventoryItem);
      initialized.value = true;
    } catch (err) {
      error.value = err;
      if (!options.silent) {
        throw err;
      }
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    items.value = [];
    initialized.value = false;
    error.value = null;
  }

  watch(
    () => authStore.isAuthenticated,
    (loggedIn) => {
      if (loggedIn) {
        load({ silent: true });
      } else {
        reset();
      }
    },
    { immediate: true },
  );

  const ownedCosmeticKeys = computed(() => {
    const set = new Set();
    items.value.forEach((item) => {
      const key = resolveInventoryCosmeticKey(item);
      if (key !== null && key !== undefined) {
        set.add(String(key));
      }
    });
    return set;
  });

  const ownedBundleKeys = computed(() => {
    const set = new Set();
    items.value.forEach((item) => {
      const key = resolveInventoryBundleKey(item);
      if (key !== null && key !== undefined) {
        set.add(String(key));
      }
    });
    return set;
  });

  const itemsByBundleGroup = computed(() => {
    const map = new Map();
    items.value.forEach((item) => {
      const key = resolveInventoryBundleKey(item);
      if (key === null || key === undefined) {
        return;
      }
      const normalized = String(key);
      if (!map.has(normalized)) {
        map.set(normalized, []);
      }
      map.get(normalized).push(item);
    });
    return map;
  });

  const itemsByOfferGroup = computed(() => {
    const map = new Map();
    items.value.forEach((item) => {
      const key = resolveInventoryOfferKey(item);
      if (key === null || key === undefined) {
        return;
      }
      const normalized = String(key);
      if (!map.has(normalized)) {
        map.set(normalized, []);
      }
      map.get(normalized).push(item);
    });
    return map;
  });

  const normalizeInventoryList = (list) =>
    list
      .filter(Boolean)
      .map((entry) => entry)
      .sort((a, b) => {
        const nameA = (a.name ?? "").toString().toLowerCase();
        const nameB = (b.name ?? "").toString().toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });

  function resolveLinkedItems(target) {
    if (!target) {
      return [];
    }
    const bundleKey = resolveInventoryBundleKey(target);
    if (bundleKey !== null && bundleKey !== undefined) {
      const linked = itemsByBundleGroup.value.get(String(bundleKey));
      if (linked?.length) {
        return normalizeInventoryList(linked);
      }
    }
    const offerKey = resolveInventoryOfferKey(target);
    if (offerKey !== null && offerKey !== undefined) {
      const linked = itemsByOfferGroup.value.get(String(offerKey));
      if (linked?.length) {
        return normalizeInventoryList(linked);
      }
    }
    return [target].filter(Boolean);
  }

  function buildSellScope(target) {
    const linkedItems = resolveLinkedItems(target);
    const offerKey = resolveInventoryOfferKey(target);
    const bundleKey = resolveInventoryBundleKey(target);
    const isBundle = linkedItems.length > 1 && Boolean(bundleKey || offerKey);
    return {
      isBundle,
      linkedItems,
      offerId: offerKey ?? null,
      bundleId: bundleKey ?? null,
      target,
    };
  }

  function removeEntriesByIds(entryIds = []) {
    if (!Array.isArray(entryIds) || !entryIds.length) {
      return;
    }
    const normalized = new Set(
      entryIds
        .map((value) => {
          if (value === null || value === undefined) {
            return null;
          }
          return String(value);
        })
        .filter(Boolean),
    );

    items.value = items.value.filter((item) => {
      const entryKey = resolveInventoryEntryKey(item);
      if (entryKey === null || entryKey === undefined) {
        return true;
      }
      return !normalized.has(String(entryKey));
    });
  }

  function ownsCosmetic(candidate) {
    const key = resolveCosmeticCandidateKey(candidate);
    if (key === null || key === undefined) {
      return false;
    }
    return ownedCosmeticKeys.value.has(String(key));
  }

  function ownsBundle(candidate) {
    const key = resolveBundleCandidateKey(candidate);
    if (key === null || key === undefined) {
      return false;
    }
    return ownedBundleKeys.value.has(String(key));
  }

  function ownsCartEntry(entry) {
    if (!entry) {
      return false;
    }
    return ownsBundle(entry) || ownsCosmetic(entry);
  }

  return {
    items,
    loading,
    error,
    initialized,
    load,
    reset,
    ownsCosmetic,
    ownsBundle,
    ownsCartEntry,
    buildSellScope,
    removeEntriesByIds,
  };
});