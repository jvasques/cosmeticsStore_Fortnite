import { defineStore } from "pinia";
import { ref, reactive, computed } from "vue";
import { fetchCosmetics } from "../services/catalogService.js";
import { fetchShopEntries } from "../services/shopService.js";
import { mockCosmetics, mockBundles } from "../mock/catalog.js";

export const useCatalogStore = defineStore("catalog", () => {
  const cosmetics = ref([]);
  const bundles = ref([]);
  const loading = ref(false);
  const lastUpdated = ref(null);

  const filters = reactive({
    search: "",
    rarity: "all",
    type: "all",
    isNew: false,
    onSale: false,
  });

  async function loadCatalog() {
    loading.value = true;
    try {
      const [cosmeticsResponse, shopResponse] = await Promise.all([
        fetchCosmetics(),
        fetchShopEntries(),
      ]);
      cosmetics.value = cosmeticsResponse.items ?? cosmeticsResponse.data ?? cosmeticsResponse ?? [];
      bundles.value = shopResponse.bundles ?? shopResponse.items ?? shopResponse ?? [];
      lastUpdated.value = new Date().toISOString();
    } catch (error) {
      console.warn("Falling back to mock data", error);
      cosmetics.value = mockCosmetics;
      bundles.value = mockBundles;
    } finally {
      loading.value = false;
    }
  }

  const filteredCosmetics = computed(() => {
    return cosmetics.value.filter((item) => {
      const matchesSearch = filters.search
        ? `${item.name} ${item.description}`.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      const matchesRarity = filters.rarity === "all" ? true : (item.rarity ?? item.rarity_value) === filters.rarity;
      const matchesType = filters.type === "all" ? true : (item.type ?? item.type_value) === filters.type;
      const matchesNew = filters.isNew ? Boolean(item.is_new ?? item.isNew) : true;
      const matchesSale = filters.onSale ? Boolean(item.is_on_sale ?? item.isOnSale) : true;
      return matchesSearch && matchesRarity && matchesType && matchesNew && matchesSale;
    });
  });

  const promoBundles = computed(() => bundles.value.filter((bundle) => bundle.finalPrice < bundle.regularPrice));

  function setFilter(key, value) {
    filters[key] = value;
  }

  return {
    cosmetics,
    bundles,
    filters,
    filteredCosmetics,
    promoBundles,
    loading,
    lastUpdated,
    loadCatalog,
    setFilter,
  };
});