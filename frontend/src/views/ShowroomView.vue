<script setup>
import { computed, onMounted, ref } from "vue";
import { useCatalogStore } from "../stores/catalogStore.js";
import CosmeticCard from "../components/CosmeticCard.vue";
import BaseBadge from "../components/ui/BaseBadge.vue";
import SkeletonBlock from "../components/ui/SkeletonBlock.vue";
import ModalShell from "../components/ui/ModalShell.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import { useCartStore } from "../stores/cartStore.js";
import { fetchShopEntries } from "../services/shopService.js";
import { useInventoryStore } from "../stores/inventoryStore.js";
import { useAuthStore } from "../stores/authStore.js";

const catalogStore = useCatalogStore();
const cartStore = useCartStore();
const inventoryStore = useInventoryStore();
const authStore = useAuthStore();
const inspectCosmetic = ref(null);
const availabilityLoading = ref(false);
const availabilityError = ref(null);
const totalItems = computed(() => catalogStore.filteredCount ?? catalogStore.cosmetics.length);
const isAuthenticated = computed(() => authStore.isAuthenticated);

onMounted(() => {
  catalogStore.loadCatalog({ reset: true, page: 1 });
  loadAvailability();
});

const rarityOptions = computed(() => {
  const unique = new Set();
  catalogStore.cosmetics.forEach((item) => {
    const rarity = item.rarity ?? item.rarity_value;
    if (rarity) {
      unique.add(rarity);
    }
  });
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
});

const typeOptions = computed(() => {
  const unique = new Set();
  catalogStore.cosmetics.forEach((item) => {
    const type = item.type ?? item.type_value;
    if (type) {
      unique.add(type);
    }
  });
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
});

const activeFilters = computed(() => {
  const f = catalogStore.filters;
  return [
    Boolean(f.search?.trim()),
    f.rarity !== "all",
    f.type !== "all",
    Boolean(f.introduced.start),
    Boolean(f.introduced.end),
    f.onlyNew,
    f.onlyAvailable,
    f.onlyPromo,
  ].filter(Boolean).length;
});

const hasSaleFlag = (cosmetic) => {
  const directFlag = cosmetic?.is_on_sale ?? cosmetic?.isOnSale;
  if (directFlag) {
    return true;
  }
  return Boolean(getOffer(cosmetic));
};
const hasNewFlag = (cosmetic) => Boolean(cosmetic.is_new ?? cosmetic.isNew);

const normalizePriceValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const isPromoOffer = (offer) => {
  if (!offer) {
    return false;
  }
  if (typeof offer.isPromo === "boolean") {
    return offer.isPromo;
  }
  const final = normalizePriceValue(offer.finalPrice ?? offer.final_price ?? offer.price ?? offer.cost);
  const regular = normalizePriceValue(
    offer.regularPrice ?? offer.regular_price ?? offer.basePrice ?? offer.originalPrice ?? final,
  );
  if (final === null || regular === null) {
    return false;
  }
  return final < regular;
};

const hasPromoFlag = (cosmetic) => {
  const directFlag = cosmetic?.is_promo ?? cosmetic?.isPromo ?? cosmetic?.promo;
  if (typeof directFlag === "boolean") {
    return directFlag;
  }
  return isPromoOffer(getOffer(cosmetic));
};

function handleInspect(cosmetic) {
  inspectCosmetic.value = cosmetic;
}

function closeModal() {
  inspectCosmetic.value = null;
}

function isOwned(cosmetic) {
  return inventoryStore.ownsCosmetic(cosmetic);
}

function isPurchasable(cosmetic) {
  if (!cosmetic?.id) {
    return false;
  }
  return Boolean(getOffer(cosmetic)) && !isOwned(cosmetic);
}

function addToCart(cosmetic) {
  if (!authStore.isAuthenticated) {
    cartStore.showToast("Entre para comprar itens", "error", 2500);
    return;
  }
  const offer = getOffer(cosmetic);
  if (!offer) {
    return;
  }
  if (isOwned(cosmetic)) {
    cartStore.showToast("Você já possui este item", "error", 2500);
    return;
  }
  if (isInCart(cosmetic)) {
    cartStore.showToast("Item já está no carrinho", "error", 2500);
    return;
  }
  cartStore.add({
    id: cosmetic.id,
    offerId: offer.offerId,
    name: cosmetic.name,
    type: cosmetic.type ?? cosmetic.type_value,
    regularPrice: offer.regularPrice,
    finalPrice: offer.finalPrice,
  });
}

async function loadAvailability() {
  availabilityLoading.value = true;
  availabilityError.value = null;
  const aggregated = [];
  const limit = 50;
  let offset = 0;
  let iterations = 0;
  const maxIterations = 10;

  try {
    while (true) {
      const response = await fetchShopEntries({ limit, offset });
      const batch = Array.isArray(response) ? response : response.items ?? [];
      aggregated.push(...batch);

      const total = response.total ?? aggregated.length;
      iterations += 1;
      const exhausted = batch.length < limit || aggregated.length >= total || iterations >= maxIterations;
      if (exhausted) {
        break;
      }
      offset += limit;
    }

    const index = {};
    aggregated.forEach((entry) => {
      const items = Array.isArray(entry.items) ? entry.items : [];
      const normalizedItems = items
        .map((raw) => ({ raw, id: raw?.id ?? raw?.itemId ?? raw?.templateId ?? raw?.item?.id ?? null }))
        .filter((item) => Boolean(item.id));

      const rawSectionLabel =
        entry.section?.displayName ??
        entry.section?.name ??
        entry.section_name ??
        entry.sectionName ??
        entry.section ??
        entry.displayGroup ??
        null;
      const sectionLabel = typeof rawSectionLabel === "string" ? rawSectionLabel : null;
      const sectionLooksLikeBundle = sectionLabel ? sectionLabel.toLowerCase().includes("bundle") : false;

      const entryLooksLikeBundle =
        normalizedItems.length !== 1 ||
        Boolean(
          entry.bundle ??
            entry.bundleName ??
            entry.bundle_name ??
            entry.bundleId ??
            entry.bundle_id ??
            entry.bundleInfo ??
            entry.bundle_info ??
            entry.bundle,
        ) ||
        sectionLooksLikeBundle;

      if (entryLooksLikeBundle) {
        return;
      }

      const [{ raw: item, id: itemId }] = normalizedItems;

      const offerId = entry.offer_id ?? entry.offerId ?? entry.id;
      const expiresAt = entry.out_date ?? entry.outDate ?? entry.expires_at ?? entry.expiresAt ?? null;
      const entryRegular = normalizePriceValue(entry.regular_price ?? entry.regularPrice);
      const entryFinal = normalizePriceValue(entry.final_price ?? entry.finalPrice ?? entryRegular);
      const section = sectionLabel;
      const banner = entry.banner ?? entry.bannerText ?? entry.displayBanner ?? null;
      const promoFlag = typeof entry.isPromo === "boolean" ? entry.isPromo : entry.promo;

      const itemFinal =
        normalizePriceValue(item?.final_price ?? item?.finalPrice ?? item?.price ?? item?.cost) ?? entryFinal;
      const itemRegular =
        normalizePriceValue(item?.regular_price ?? item?.regularPrice ?? item?.basePrice) ?? entryRegular ?? itemFinal;

      const availability = {
        offerId,
        finalPrice: itemFinal ?? itemRegular ?? null,
        regularPrice: itemRegular ?? itemFinal ?? null,
        expiresAt,
        section,
        banner,
      };

      availability.isPromo =
        typeof item?.isPromo === "boolean"
          ? item.isPromo
          : typeof promoFlag === "boolean"
            ? promoFlag
            : itemFinal !== null && itemRegular !== null && itemFinal < itemRegular;

      index[itemId] = availability;
    });

    catalogStore.setAvailability(index);
  } catch (error) {
    availabilityError.value = error;
  } finally {
    availabilityLoading.value = false;
  }
}

function clearFilters() {
  catalogStore.resetFilters();
}

function getOffer(cosmetic) {
  return cosmetic?.id ? catalogStore.getAvailabilityById(cosmetic.id) : null;
}

const resolveCartKeyFromCosmetic = (cosmetic) => {
  if (!cosmetic) {
    return null;
  }
  const offer = getOffer(cosmetic);
  return offer?.offerId ?? offer?.offer_id ?? cosmetic.id ?? cosmetic.cosmeticId ?? null;
};

function isInCart(cosmetic) {
  const key = resolveCartKeyFromCosmetic(cosmetic);
  return key ? cartStore.has(key) : false;
}
</script>

<template>
  <section class="space-y-6">
    <header class="glass-panel flex flex-wrap items-center justify-between gap-4 px-6 py-4">
      <div>
        <p class="text-xs uppercase tracking-[0.4em] text-white/50">Showroom</p>
        <h1 class="text-3xl font-black text-white">Coleção completa</h1>
        <p class="text-sm text-white/60">Última atualização: {{ catalogStore.lastUpdated ?? '—' }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseBadge variant="success">
          {{ totalItems }} itens
        </BaseBadge>
        <BaseBadge :variant="activeFilters ? 'warning' : 'neutral'">
          {{ activeFilters ? `${activeFilters} filtros ativos` : 'Sem Filtro' }}
        </BaseBadge>
      </div>
    </header>

    <section class="glass-panel space-y-4 px-6 py-5">
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label class="space-y-1 text-sm">
          <span class="text-white/60">Pesquisa</span>
          <input
            v-model="catalogStore.filters.search"
            type="text"
            placeholder="Nome ou descrição"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-brand-light focus:outline-none"
          />
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-white/60">Tipo</span>
          <select
            v-model="catalogStore.filters.type"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-brand-light focus:outline-none"
          >
            <option class="bg-slate-900 text-white" value="all">Todos</option>
            <option
              v-for="type in typeOptions"
              :key="type"
              class="bg-slate-900 text-white"
              :value="type"
            >
              {{ type }}
            </option>
          </select>
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-white/60">Raridade</span>
          <select
            v-model="catalogStore.filters.rarity"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-brand-light focus:outline-none"
          >
            <option class="bg-slate-900 text-white" value="all">Todas</option>
            <option
              v-for="rarity in rarityOptions"
              :key="rarity"
              class="bg-slate-900 text-white"
              :value="rarity"
            >
              {{ rarity }}
            </option>
          </select>
        </label>
        <div class="flex items-end justify-end">
          <BaseButton v-if="activeFilters" variant="ghost" size="sm" @click="clearFilters">Limpar filtros</BaseButton>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="space-y-1 text-sm">
          <span class="text-white/60">Incluído a partir de</span>
          <input
            v-model="catalogStore.filters.introduced.start"
            type="date"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-brand-light focus:outline-none"
          />
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-white/60">Incluído até</span>
          <input
            v-model="catalogStore.filters.introduced.end"
            type="date"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-brand-light focus:outline-none"
          />
        </label>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition"
          :class="catalogStore.filters.onlyNew ? 'border-brand-light/50 bg-brand-light/10 text-white' : 'border-white/10 bg-white/5 text-white/70'"
          @click="catalogStore.filters.onlyNew = !catalogStore.filters.onlyNew"
        >
          <span class="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          Novos
        </button>
        <button
          type="button"
          class="flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition"
          :class="catalogStore.filters.onlyAvailable ? 'border-brand-light/50 bg-brand-light/10 text-white' : 'border-white/10 bg-white/5 text-white/70'"
          @click="catalogStore.filters.onlyAvailable = !catalogStore.filters.onlyAvailable"
        >
          <span class="inline-block h-2 w-2 rounded-full bg-sky-400" />
          À venda
          <small v-if="availabilityLoading" class="text-[10px] uppercase tracking-widest text-white/50">Atualizando…</small>
        </button>
        <button
          type="button"
          class="flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition"
          :class="catalogStore.filters.onlyPromo ? 'border-brand-light/50 bg-brand-light/10 text-white' : 'border-white/10 bg-white/5 text-white/70'"
          @click="catalogStore.filters.onlyPromo = !catalogStore.filters.onlyPromo"
        >
          <span class="inline-block h-2 w-2 rounded-full bg-amber-400" />
          Em promoção
        </button>
      </div>
      <p v-if="availabilityError" class="text-xs text-rose-300">Não foi possível sincronizar a loja. Tente recarregar mais tarde.</p>
    </section>

    <div v-if="catalogStore.loading" class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <SkeletonBlock v-for="i in 6" :key="i" class="h-64" />
    </div>

    <div v-else-if="catalogStore.error" class="glass-panel space-y-4 px-6 py-8 text-center">
      <p class="text-lg font-semibold text-white">Não foi possível falar com o backend agora.</p>
      <p class="text-sm text-white/60">Verifique se o servidor em http://localhost:3000 está de pé e tente novamente.</p>
      <BaseButton @click="catalogStore.loadCatalog({ reset: true })">Tentar novamente</BaseButton>
    </div>

    <div
      v-else-if="catalogStore.paginatedCosmetics.length"
      class="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      <CosmeticCard
        v-for="cosmetic in catalogStore.paginatedCosmetics"
        :key="cosmetic.id"
        :cosmetic="cosmetic"
        :is-new="hasNewFlag(cosmetic)"
        :is-on-sale="hasSaleFlag(cosmetic)"
        :is-promo="hasPromoFlag(cosmetic)"
        :in-cart="isInCart(cosmetic)"
        :purchasable="!isInCart(cosmetic) && isPurchasable(cosmetic)"
        :price="getOffer(cosmetic)"
        :owned="isOwned(cosmetic)"
        :auth-locked="!isAuthenticated"
        @inspect="handleInspect"
        @add-to-cart="addToCart"
      />
    </div>

    <div v-else class="glass-panel px-6 py-10 text-center text-white/70">
      Nenhum item encontrado com os filtros atuais.
    </div>

    <div v-if="catalogStore.pagination.total" class="flex items-center justify-center gap-4">
      <BaseButton
        variant="secondary"
        :disabled="catalogStore.loading || catalogStore.pagination.page === 1"
        @click="catalogStore.goToPage(catalogStore.pagination.page - 1)"
      >
        Página anterior
      </BaseButton>
      <p class="text-sm text-white/70">
        Página {{ catalogStore.pagination.page }} de {{ catalogStore.pagination.totalPages ?? '?' }}
      </p>
      <BaseButton
        :disabled="catalogStore.loading || !catalogStore.pagination.hasMore"
        @click="catalogStore.goToPage(catalogStore.pagination.page + 1)"
      >
        Próxima página
      </BaseButton>
    </div>

    <ModalShell :open="Boolean(inspectCosmetic)" @close="closeModal">
      <template v-if="inspectCosmetic">
        <div class="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <img
            :src="inspectCosmetic.images?.icon ?? inspectCosmetic.images?.smallIcon"
            :alt="inspectCosmetic.name"
            class="h-80 w-full rounded-3xl object-cover"
          />
          <div class="space-y-4">
            <div class="flex flex-wrap gap-2">
              <BaseBadge v-if="hasNewFlag(inspectCosmetic)" variant="success">Novo</BaseBadge>
              <BaseBadge v-if="hasSaleFlag(inspectCosmetic)" variant="warning">Loja</BaseBadge>
              <BaseBadge v-if="hasPromoFlag(inspectCosmetic)" variant="promo">Promoção</BaseBadge>
              <BaseBadge v-if="isInCart(inspectCosmetic)" variant="neutral">No carrinho</BaseBadge>
              <BaseBadge v-if="isOwned(inspectCosmetic)" variant="neutral">Adquirido</BaseBadge>
            </div>
            <header>
              <p class="text-xs uppercase tracking-[0.4em] text-white/50">
                {{ inspectCosmetic.rarity ?? inspectCosmetic.rarity_value }} · {{ inspectCosmetic.type ?? inspectCosmetic.type_value }}
              </p>
              <h2 class="text-3xl font-black text-white">{{ inspectCosmetic.name }}</h2>
            </header>
            <p class="text-white/70">
                Descrição: {{ inspectCosmetic.description ?? "Sem descrição disponível." }}
            </p>

            <p class="text-white/70">
              Inclusão: {{ inspectCosmetic.added_date ?? "Sem data disponível." }}
            </p>
            <div class="flex flex-wrap gap-3">
              <BaseButton variant="secondary" @click="closeModal">Fechar</BaseButton>
              <BaseButton
                v-if="isPurchasable(inspectCosmetic)"
                :disabled="!isAuthenticated"
                @click="() => { addToCart(inspectCosmetic); closeModal(); }"
              >
                {{ isAuthenticated ? "Adquirir agora" : "Entre para comprar" }}
              </BaseButton>
            </div>
          </div>
        </div>
      </template>
    </ModalShell>
  </section>
</template>