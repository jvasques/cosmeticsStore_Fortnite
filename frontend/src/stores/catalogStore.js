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
  const pagination = reactive({ limit: 18, page: 1, total: null, totalPages: null, hasMore: true });
  const availabilityIndex = ref({});
  const availableRarities = ref([]);
  const availableTypes = ref([]);

  const filters = reactive({
    search: "",
    rarity: "all",
    type: "all",
    introduced: { start: null, end: null },
    onlyNew: false,
    onlyAvailable: false,
    onlyPromo: false,
  });

  let catalogRequestToken = 0;
  let filterDebounceHandle = null;
  let suppressFilterWatcher = false;

  function buildCatalogQuery({ page, limit }) {
    const query = {
      limit,
      offset: (page - 1) * limit,
    };

    const trimmedSearch = filters.search?.trim();
    if (trimmedSearch) {
      query.search = trimmedSearch;
    }

    if (filters.rarity && filters.rarity !== "all") {
      query.rarity = filters.rarity;
    }

    if (filters.type && filters.type !== "all") {
      query.type = filters.type;
    }

    if (filters.introduced.start) {
      query.introducedStart = filters.introduced.start;
    }

    if (filters.introduced.end) {
      query.introducedEnd = filters.introduced.end;
    }

    if (filters.onlyNew) {
      query.onlyNew = true;
    }

    if (filters.onlyAvailable) {
      query.onlyAvailable = true;
    }

    if (filters.onlyPromo) {
      query.onlyPromo = true;
    }

    return query;
  }

  function scheduleFilterReload() {
    if (filterDebounceHandle) {
      clearTimeout(filterDebounceHandle);
    }
    filterDebounceHandle = setTimeout(() => {
      loadCatalog({ reset: true, page: 1 });
    }, 300);
  }

  async function loadCatalog(options = {}) {
    const reset = options.reset ?? false;
    const limit = options.limit ?? pagination.limit;
    const basePage = reset ? 1 : pagination.page ?? 1;
    const requestedPage = Math.max(1, options.page ?? basePage);

    const requestToken = ++catalogRequestToken;

    loading.value = true;
    error.value = null;

    const query = buildCatalogQuery({ page: requestedPage, limit });

    try {
      const response = await fetchCosmetics(query);
      if (requestToken !== catalogRequestToken) {
        return;
      }

      const items = Array.isArray(response)
        ? response
        : response?.items ?? response?.data ?? [];
      const total = typeof response?.total === "number" && !Number.isNaN(response.total)
        ? response.total
        : items.length;

      cosmetics.value = items.map(normalizeCosmetic);

      pagination.limit = limit;
      pagination.total = total;
      pagination.totalPages = Math.max(1, Math.ceil(Math.max(total, 1) / limit));
      pagination.page = Math.min(requestedPage, pagination.totalPages);
      pagination.hasMore = pagination.page < pagination.totalPages;

      const facets = response?.facets ?? {};
      availableRarities.value = Array.isArray(facets.allRarities)
        ? facets.allRarities
        : Array.isArray(facets.rarities)
        ? facets.rarities
        : [];
      availableTypes.value = Array.isArray(facets.allTypes)
        ? facets.allTypes
        : Array.isArray(facets.types)
        ? facets.types
        : [];

      lastUpdated.value = new Date().toISOString();
    } catch (err) {
      if (requestToken !== catalogRequestToken) {
        return;
      }
      error.value = err;
      if (reset) {
        cosmetics.value = [];
        pagination.total = 0;
        pagination.totalPages = 1;
        pagination.hasMore = false;
      }
    } finally {
      if (requestToken === catalogRequestToken) {
        loading.value = false;
      }
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

  const filteredCosmetics = computed(() => cosmetics.value);

  const filteredCount = computed(() => pagination.total ?? cosmetics.value.length);

  const paginatedCosmetics = computed(() => cosmetics.value);

  watch(
    filters,
    () => {
      if (suppressFilterWatcher) {
        suppressFilterWatcher = false;
        return;
      }
      pagination.page = 1;
      scheduleFilterReload();
    },
    { deep: true }
  );

  const promoBundles = computed(() => bundles.value.filter((bundle) => bundle.finalPrice < bundle.regularPrice));

  function setFilter(key, value, { immediate = false } = {}) {
    if (key === "introduced" && typeof value === "object") {
      filters.introduced = { ...filters.introduced, ...value };
      pagination.page = 1;
      if (immediate) {
        suppressFilterWatcher = true;
        loadCatalog({ reset: true, page: 1 });
        return;
      }
      return;
    }
    filters[key] = value;
    pagination.page = 1;
    if (immediate) {
      suppressFilterWatcher = true;
      loadCatalog({ reset: true, page: 1 });
    }
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
    suppressFilterWatcher = true;
    loadCatalog({ reset: true, page: 1 });
  }

  function setAvailability(index = {}) {
    availabilityIndex.value = { ...(index ?? {}) };
  }

  function getAvailabilityById(id) {
    return id ? availabilityIndex.value[id] ?? null : null;
  }

  function goToPage(page) {
    const target = Math.max(1, Math.min(page, pagination.totalPages ?? 1));
    loadCatalog({ page: target });
  }

  function toggleFilter(key) {
    if (!(key in filters)) {
      return;
    }
    suppressFilterWatcher = true;
    filters[key] = !filters[key];
    pagination.page = 1;
    loadCatalog({ reset: true, page: 1 });
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
    availableRarities,
    availableTypes,
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
    toggleFilter,
  };
});