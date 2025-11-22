import { defineStore } from "pinia";
import { ref, reactive, computed, watch } from "vue";
import { fetchCosmetics } from "../services/catalogService.js";
import { fetchShopEntries } from "../services/shopService.js";

function coerceText(candidate) {
  if (!candidate) {
    return "";
  }

  if (typeof candidate === "string") {
    return candidate.trim();
  }

  if (Array.isArray(candidate)) {
    return candidate.map((entry) => coerceText(entry)).filter(Boolean).join(" ").trim();
  }

  if (typeof candidate === "object") {
    const preferredKeys = [
      "text",
      "description",
      "value",
      "display",
      "content",
      "raw",
    ];

    for (const key of preferredKeys) {
      if (candidate[key]) {
        const nested = coerceText(candidate[key]);
        if (nested) {
          return nested;
        }
      }
    }

    const locales = ["pt-BR", "pt", "br", "en", "es", "fr"];
    for (const locale of locales) {
      if (typeof candidate[locale] === "string" && candidate[locale].trim()) {
        return candidate[locale].trim();
      }
    }
  }

  return "";
}

function resolveDescription(item = {}) {
  const candidates = [
    item.description,
    item.details,
    item.story,
    item.summary,
    item.caption,
    item.tagline,
    item.flavor_text,
    item.flavorText,
    item.logline,
    item.overview,
    item.series?.description,
    item.introduction?.description,
    item.introduction?.text,
    item.introduction?.content,
  ];

  for (const candidate of candidates) {
    const text = coerceText(candidate);
    if (text) {
      return text;
    }
  }

  return "Sem descrição disponível.";
}

function parseDateCandidate(candidate) {
  if (!candidate) {
    return null;
  }

  if (candidate instanceof Date) {
    return Number.isNaN(candidate.getTime()) ? null : candidate;
  }

  if (typeof candidate === "number") {
    const fromNumber = new Date(candidate);
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
  }

  if (typeof candidate === "object") {
    const objectCandidates = [
      candidate.date,
      candidate.value,
      candidate.raw,
      candidate.timestamp,
      candidate.added,
      candidate.added_date,
    ];
    for (const nested of objectCandidates) {
      const parsed = parseDateCandidate(nested);
      if (parsed) {
        return parsed;
      }
    }
    return null;
  }

  if (typeof candidate !== "string") {
    return null;
  }

  const trimmed = candidate.trim();
  if (!trimmed) {
    return null;
  }

  const isoParsed = new Date(trimmed);
  if (!Number.isNaN(isoParsed.getTime())) {
    return isoParsed;
  }

  const slashMatch = trimmed.match(/^([0-3]?\d)[\/\-]([0-3]?\d)[\/\-](\d{2,4})$/);
  if (slashMatch) {
    const [, day, month, yearFragment] = slashMatch;
    const year = yearFragment.length === 2 ? `20${yearFragment}` : yearFragment;
    const paddedMonth = month.padStart(2, "0");
    const paddedDay = day.padStart(2, "0");
    const composed = `${year}-${paddedMonth}-${paddedDay}T00:00:00Z`;
    const parsed = new Date(composed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dotMatch = trimmed.match(/^([0-3]?\d)\.([0-3]?\d)\.(\d{2,4})$/);
  if (dotMatch) {
    const [, day, month, yearFragment] = dotMatch;
    const year = yearFragment.length === 2 ? `20${yearFragment}` : yearFragment;
    const paddedMonth = month.padStart(2, "0");
    const paddedDay = day.padStart(2, "0");
    const composed = `${year}-${paddedMonth}-${paddedDay}T00:00:00Z`;
    const parsed = new Date(composed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function resolveIntroducedDate(item = {}) {
  const candidates = [
    item.added,
    item.added_at,
    item.addedAt,
    item.added_date,
    item.releaseDate,
    item.release_date,
    item.first_seen,
    item.firstSeen,
    item.new_since,
    item.newSince,
    item.introduction?.backendValue,
    item.introduction?.added,
    item.introduction?.date,
    item.introduction?.releaseDate,
    item.shopHistory?.added,
    item.shopHistory?.added_date,
  ];

  for (const candidate of candidates) {
    const parsed = parseDateCandidate(candidate);
    if (parsed) {
      return parsed.toISOString();
    }
  }

  return null;
}

function normalizeDateOnly(value) {
  const parsed = parseDateCandidate(value);
  if (!parsed) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
}

function normalizePriceNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function detectPromoFromOffer(offer) {
  if (!offer) {
    return false;
  }
  if (typeof offer.isPromo === "boolean") {
    return offer.isPromo;
  }
  const final = normalizePriceNumber(offer.finalPrice ?? offer.final_price ?? offer.price ?? offer.cost);
  const regular = normalizePriceNumber(
    offer.regularPrice ?? offer.regular_price ?? offer.basePrice ?? offer.originalPrice ?? final,
  );
  if (final === null || regular === null) {
    return false;
  }
  return final < regular;
}

function normalizeCosmetic(item = {}) {
  const normalizedImages = {
    icon: item.images?.icon ?? item.image_icon ?? item.images?.Icon ?? null,
    smallIcon: item.images?.smallIcon ?? item.image_small_icon ?? null,
    featured: item.images?.featured ?? item.image_featured ?? item.image_feature ?? null,
  };

  const addedDateRaw =
    item.added_date ??
    item.added ??
    item.added_at ??
    item.addedAt ??
    item.releaseDate ??
    item.release_date;

  return {
    ...item,
    rarity: item.rarity ?? item.rarity_value ?? item.rarityValue ?? item.rarity ?? "common",
    type: item.type ?? item.type_value ?? item.typeValue ?? item.type ?? "outfit",
    description: resolveDescription(item),
    images: normalizedImages,
    is_new: item.is_new ?? item.isNew ?? false,
    is_on_sale: item.is_on_sale ?? item.isOnSale ?? false,
    introduced_at: resolveIntroducedDate(item),
    added_date_value: normalizeDateOnly(addedDateRaw) ?? normalizeDateOnly(item.first_seen ?? item.firstSeen),
  };
}

export const useCatalogStore = defineStore("catalog", () => {
  const cosmetics = ref([]);
  const bundles = ref([]);
  const loading = ref(false);
  const shopLoading = ref(false);
  const error = ref(null);
  const shopError = ref(null);
  const lastUpdated = ref(null);
  const pagination = reactive({ limit: 20, page: 1, total: null, totalPages: null, hasMore: true });
  const availabilityIndex = ref({});

  const filters = reactive({
    search: "",
    rarity: "all",
    type: "all",
    introduced: { start: null, end: null },
    onlyNew: false,
    onlyAvailable: false,
    onlyPromo: false,
  });

  async function loadCatalog(options = {}) {
    if (loading.value) {
      return;
    }

    const reset = options.reset ?? false;
    const requestLimit = options.requestLimit ?? 100;
    const targetPage = options.page ?? (reset ? 1 : pagination.page ?? 1);
    const page = Math.max(1, targetPage);

    pagination.limit = options.limit ?? pagination.limit;
    pagination.page = page;

    if (reset) {
      pagination.total = null;
      pagination.totalPages = null;
      pagination.hasMore = true;
    }

    loading.value = true;
    error.value = null;
    const aggregated = [];
    let offset = 0;
    let iterations = 0;
    const maxIterations = options.maxIterations ?? 500;
    let reportedTotal = null;

    try {
      while (true) {
        const response = await fetchCosmetics({ limit: requestLimit, offset });
        const batch = Array.isArray(response)
          ? response
          : response.items ?? response.data ?? [];

        if (!batch.length) {
          break;
        }

        aggregated.push(...batch.map(normalizeCosmetic));
        if (reportedTotal === null && typeof response.total === "number" && !Number.isNaN(response.total)) {
          reportedTotal = response.total;
        }
        offset += requestLimit;
        iterations += 1;

        const reachedReportedTotal = typeof reportedTotal === "number" && aggregated.length >= reportedTotal;
        const exhaustedBatch = batch.length < requestLimit;
        const exceededGuard = iterations >= maxIterations;
        const done = exhaustedBatch || reachedReportedTotal || exceededGuard;

        if (done) {
          break;
        }
      }

      if (aggregated.length) {
        cosmetics.value = aggregated;
      } else if (!cosmetics.value.length || reset) {
        cosmetics.value = [];
      }

      pagination.total = cosmetics.value.length;
      pagination.totalPages = Math.max(1, Math.ceil(Math.max(pagination.total, 1) / pagination.limit));
      pagination.hasMore = pagination.page < pagination.totalPages;

      lastUpdated.value = new Date().toISOString();
    } catch (err) {
      error.value = err;
      if (!cosmetics.value.length || reset) {
        cosmetics.value = [];
        pagination.total = 0;
        pagination.totalPages = 1;
        pagination.hasMore = false;
      }
    } finally {
      loading.value = false;
    }
  }

  const bundlePagination = reactive({ limit: 20, page: 1, total: null, totalPages: null, hasMore: true });

  async function loadShop(options = {}) {
    shopLoading.value = true;
    shopError.value = null;

    const limit = options.limit ?? bundlePagination.limit;
    const reset = options.reset ?? false;
    const targetPage = options.page ?? (reset ? 1 : bundlePagination.page ?? 1);
    const page = Math.max(1, targetPage);
    const offset = (page - 1) * limit;

    const query = {
      limit,
      offset,
      bundle: options.bundle,
      rarity: options.rarity,
      type: options.type,
      newOnly: options.newOnly,
    };

    try {
      const response = await fetchShopEntries(query);
      const batch = Array.isArray(response) ? response : response.items ?? response.bundles ?? [];
      bundles.value = batch;

      bundlePagination.page = page;
      bundlePagination.limit = limit;
      bundlePagination.total = response.total ?? bundlePagination.total;

      if (typeof bundlePagination.total === "number" && !Number.isNaN(bundlePagination.total)) {
        bundlePagination.totalPages = Math.max(1, Math.ceil(bundlePagination.total / limit));
      }

      const hasTotal = typeof bundlePagination.totalPages === "number";
      bundlePagination.hasMore = hasTotal ? page < bundlePagination.totalPages : batch.length === limit;
    } catch (err) {
      shopError.value = err;
      if (!bundles.value.length || reset) {
        bundles.value = [];
      }
      bundlePagination.hasMore = false;
    } finally {
      shopLoading.value = false;
    }
  }

  const filteredCosmetics = computed(() => {
    const startDateValue = filters.introduced.start ? normalizeDateOnly(filters.introduced.start) : null;
    const endDateValue = filters.introduced.end ? normalizeDateOnly(filters.introduced.end) : null;

    return cosmetics.value.filter((item) => {
      const matchesSearch = filters.search
        ? String(item.name ?? "").toLowerCase().includes(filters.search.toLowerCase())
        : true;
      const matchesRarity = filters.rarity === "all" ? true : (item.rarity ?? item.rarity_value) === filters.rarity;
      const matchesType = filters.type === "all" ? true : (item.type ?? item.type_value) === filters.type;
      const itemDateValue = item.added_date_value ?? (item.introduced_at ? item.introduced_at.slice(0, 10) : null);
      const matchesIntroWindow = startDateValue || endDateValue
        ? itemDateValue && (!startDateValue || itemDateValue >= startDateValue) && (!endDateValue || itemDateValue <= endDateValue)
        : true;
      const matchesNew = filters.onlyNew ? Boolean(item.is_new ?? item.isNew) : true;
      const offer = availabilityIndex.value[item.id];
      const matchesAvailable = filters.onlyAvailable ? Boolean(offer) : true;
      const isPromoOffer = detectPromoFromOffer(offer);
      const matchesPromo = filters.onlyPromo ? Boolean(offer) && isPromoOffer : true;

      return (
        matchesSearch &&
        matchesRarity &&
        matchesType &&
        matchesIntroWindow &&
        matchesNew &&
        matchesAvailable &&
        matchesPromo
      );
    });
  });

  const filteredCount = computed(() => filteredCosmetics.value.length);

  const paginatedCosmetics = computed(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filteredCosmetics.value.slice(start, start + pagination.limit);
  });

  watch(
    () => [filteredCount.value, pagination.limit],
    () => {
      const total = filteredCount.value;
      pagination.total = total;
      pagination.totalPages = Math.max(1, Math.ceil(Math.max(total, 1) / pagination.limit));
      if (pagination.page > pagination.totalPages) {
        pagination.page = pagination.totalPages;
      }
      pagination.hasMore = pagination.page < pagination.totalPages;
    },
    { immediate: true }
  );

  const promoBundles = computed(() => bundles.value.filter((bundle) => bundle.finalPrice < bundle.regularPrice));

  function setFilter(key, value) {
    if (key === "introduced" && typeof value === "object") {
      filters.introduced = { ...filters.introduced, ...value };
      pagination.page = 1;
      return;
    }
    filters[key] = value;
    pagination.page = 1;
  }

  function resetFilters() {
    filters.search = "";
    filters.rarity = "all";
    filters.type = "all";
    filters.introduced.start = null;
    filters.introduced.end = null;
    filters.onlyNew = false;
    filters.onlyAvailable = false;
    filters.onlyPromo = false;
    pagination.page = 1;
  }

  function setAvailability(index = {}) {
    availabilityIndex.value = { ...(index ?? {}) };
  }

  function getAvailabilityById(id) {
    return id ? availabilityIndex.value[id] ?? null : null;
  }

  function goToPage(page) {
    const target = Math.max(1, Math.min(page, pagination.totalPages ?? 1));
    pagination.page = target;
  }

  return {
    cosmetics,
    bundles,
    bundlePagination,
    pagination,
    filters,
    filteredCosmetics,
    filteredCount,
    paginatedCosmetics,
    promoBundles,
    availabilityIndex,
    loading,
    shopLoading,
    error,
    shopError,
    lastUpdated,
    loadCatalog,
    loadShop,
    setFilter,
    resetFilters,
    setAvailability,
    getAvailabilityById,
    goToPage,
  };
});