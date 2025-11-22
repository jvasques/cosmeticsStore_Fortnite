<script setup>
import { computed, onMounted, ref } from "vue";
import { useCatalogStore } from "../stores/catalogStore.js";
import BundleCard from "../components/BundleCard.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import ModalShell from "../components/ui/ModalShell.vue";
import BaseBadge from "../components/ui/BaseBadge.vue";
import { useCartStore } from "../stores/cartStore.js";
import { useInventoryStore } from "../stores/inventoryStore.js";
import { useAuthStore } from "../stores/authStore.js";

const catalogStore = useCatalogStore();
const cartStore = useCartStore();
const inventoryStore = useInventoryStore();
const authStore = useAuthStore();
const inspectBundle = ref(null);
const inspectItem = ref(null);
const isAuthenticated = computed(() => authStore.isAuthenticated);

const bundleCount = computed(() => catalogStore.bundlePagination.total ?? catalogStore.bundles.length);
const bundleName = (bundle) =>
  bundle.bundleName ??
  bundle.bundle_name ??
  bundle.name ??
  `${bundle.items?.length ?? 0} cosmetics`;

onMounted(() => {
  if (!catalogStore.bundles.length) {
    catalogStore.loadShop({ bundle: true, limit: catalogStore.bundlePagination.limit, page: 1, reset: true });
  }
});

function inspect(bundle) {
  inspectBundle.value = bundle;
}

function closeModal() {
  inspectItem.value = null;
  inspectBundle.value = null;
}

const isBundleOwned = (bundle) => inventoryStore.ownsBundle(bundle);

function addBundle(bundle) {
  if (!authStore.isAuthenticated) {
    cartStore.showToast("Entre para comprar bundles", "error", 2500);
    return;
  }
  if (isBundleOwned(bundle)) {
    cartStore.showToast("Você já possui este bundle", "error", 2500);
    return;
  }
  if (cartStore.has(bundle)) {
    cartStore.showToast("Bundle já está no carrinho", "error", 2500);
    return;
  }
  cartStore.add({
    offerId: bundle.offerId ?? bundle.offer_id,
    bundleName: bundle.bundleName ?? bundle.bundle_name ?? bundle.name,
    regularPrice: bundle.regularPrice ?? bundle.regular_price ?? bundle.final_price ?? 0,
    finalPrice: bundle.finalPrice ?? bundle.final_price ?? bundle.regular_price ?? 0,
    type: bundle.is_bundle === false ? "item" : "bundle",
  });
}

const resolveItemImage = (item) => item.image_icon ?? item.image_feature ?? item.image_small_icon ?? item.images?.icon;
const resolveRarity = (item) => item.rarity_value ?? item.rarity ?? "common";
const resolveType = (item) => item.type_value ?? item.type ?? "unknown";
const resolveDate = (bundle) => {
  const raw = bundle?.out_date;
  if (!raw) return "—";

  const date = new Date(raw);
  return isNaN(date.getTime()) ? raw : date.toLocaleDateString("pt-BR");
};

function inspectBundleItem(item) {
  inspectItem.value = item;
}

function backToBundleDetails() {
  inspectItem.value = null;
}
</script>

<template>
  <section class="space-y-6">
    <header class="glass-panel px-6 py-4">
      <p class="text-xs uppercase tracking-[0.4em] text-white/50">Bundles</p>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-white">Ofertas da loja</h1>
          <p class="text-sm text-white/60">{{ bundleCount }} bundles ativos</p>
        </div>
        <BaseButton
          variant="secondary"
          size="sm"
          :disabled="catalogStore.shopLoading"
          @click="catalogStore.loadShop({ bundle: true, limit: catalogStore.bundlePagination.limit, page: catalogStore.bundlePagination.page })"
        >
          {{ catalogStore.shopLoading ? "Atualizando..." : "Recarregar" }}
        </BaseButton>
      </div>
    </header>

    <div v-if="catalogStore.shopLoading" class="grid gap-5 md:grid-cols-2">
      <div v-for="i in 4" :key="i" class="glass-panel h-48 animate-pulse" />
    </div>

    <div v-else-if="catalogStore.shopError" class="glass-panel space-y-4 px-6 py-8 text-center">
      <p class="font-semibold text-white">Não foi possível obter as ofertas.</p>
      <BaseButton @click="catalogStore.loadShop({ limit: 12, bundle: true })">Tentar novamente</BaseButton>
    </div>

    <div v-else-if="catalogStore.bundles.length" class="grid gap-5 md:grid-cols-2">
      <BundleCard
        v-for="bundle in catalogStore.bundles"
        :key="bundle.offerId ?? bundle.offer_id"
        :bundle="bundle"
        :owned="isBundleOwned(bundle)"
        :auth-locked="!isAuthenticated"
        @inspect="inspect"
        @purchase="addBundle"
      />
    </div>

    <div v-else class="glass-panel px-6 py-10 text-center text-white/70">
      Nenhuma oferta disponível agora.
    </div>

    <div v-if="catalogStore.bundlePagination.totalPages" class="flex items-center justify-center gap-4">
      <BaseButton
        variant="secondary"
        :disabled="catalogStore.shopLoading || catalogStore.bundlePagination.page === 1"
        @click="catalogStore.loadShop({ bundle: true, page: catalogStore.bundlePagination.page - 1 })"
      >
        Página anterior
      </BaseButton>
      <p class="text-sm text-white/70">
        Página {{ catalogStore.bundlePagination.page }} de {{ catalogStore.bundlePagination.totalPages ?? '?' }}
      </p>
      <BaseButton
        :disabled="catalogStore.shopLoading || !catalogStore.bundlePagination.hasMore"
        @click="catalogStore.loadShop({ bundle: true, page: catalogStore.bundlePagination.page + 1 })"
      >
        Próxima página
      </BaseButton>
    </div>

    <ModalShell :open="Boolean(inspectBundle)" @close="closeModal">
      <template v-if="inspectBundle">
        <div v-if="inspectItem" class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <img
            :src="resolveItemImage(inspectItem)
              ?? inspectBundle?.bundle_image
              ?? inspectBundle?.items?.[0]?.image_icon"
            :alt="inspectItem.name"
            class="h-72 w-full rounded-3xl object-cover"
          />
          <div class="space-y-4">
            <div class="flex flex-wrap gap-2">
              <BaseBadge v-if="inspectItem.is_new || inspectItem.isNew" variant="success">Novo</BaseBadge>
              <BaseBadge v-if="inspectItem.is_on_sale || inspectItem.isOnSale" variant="warning">Loja</BaseBadge>
            </div>
            <header>
              <p class="text-xs uppercase tracking-[0.4em] text-white/50">
                {{ resolveRarity(inspectItem) }} · {{ resolveType(inspectItem) }}
              </p>
              <h2 class="text-3xl font-black text-white">{{ inspectItem.name }}</h2>
            </header>
            <p class="text-white/70">
              {{ inspectItem.description ?? "Sem descrição disponível." }}
            </p>
            <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              <p><span class="font-semibold text-white">Bundle:</span> {{ bundleName(inspectBundle) }}</p>
              <p>
                <span class="font-semibold text-white">Disponível até:</span>
                {{ resolveDate(inspectBundle) }}
              </p>
            </div>
            <div class="flex flex-wrap justify-end gap-3">
              <BaseButton variant="secondary" @click="backToBundleDetails">Voltar</BaseButton>
              <BaseButton variant="secondary" @click="closeModal">Fechar</BaseButton>
            </div>
          </div>
        </div>
        <div v-else class="space-y-6">
          <header class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-[0.4em] text-white/50">Bundle</p>
              <h2 class="text-3xl font-black text-white">{{ bundleName(inspectBundle) }}</h2>
              <p class="text-sm text-white/70">{{ inspectBundle.description ?? 'Sem descrição disponível.' }}</p>
            </div>
            <div class="text-right">
              <p class="text-xs uppercase tracking-[0.4em] text-white/50">Valor</p>
              <p class="text-2xl font-black text-brand-light">
                {{ (inspectBundle.finalPrice ?? inspectBundle.final_price ?? inspectBundle.regular_price ?? 0).toLocaleString('pt-BR') }} VB
              </p>
              <p class="text-xs text-white/60" v-if="inspectBundle.regular_price">
                Valor Original: {{ (inspectBundle.regularPrice ?? inspectBundle.regular_price).toLocaleString('pt-BR') }} VB
              </p>
            </div>
          </header>

          <div class="flex flex-wrap gap-3" v-if="inspectBundle.items?.length">
            <BaseBadge variant="neutral">{{ inspectBundle.items.length }} itens</BaseBadge>
            <BaseBadge v-if="inspectBundle.is_bundle === false" variant="warning">Item individual</BaseBadge>
          </div>

          <div v-if="inspectBundle.items?.length" class="grid gap-4 md:grid-cols-2">
            <article
              v-for="item in inspectBundle.items"
              :key="item.id ?? item.offer_id ?? item.cosmetic_id"
              class="rounded-3xl border border-white/5 bg-white/5 p-4 flex flex-col justify-between min-h-[160px]"
            >
              <div class="flex items-center gap-4">
                <img
                  v-if="resolveItemImage(item)"
                  :src="resolveItemImage(item)"
                  :alt="item.name"
                  class="h-16 w-16 rounded-2xl object-cover"
                />
                <div>
                  <p class="text-xs uppercase tracking-[0.4em] text-white/50">{{ resolveRarity(item) }}</p>
                  <p class="text-lg font-semibold text-white">{{ item.name }}</p>
                  <p class="text-sm text-white/60 line-clamp-2">{{ item.description ?? 'Sem descrição.' }}</p>
                </div>
              </div>
              <div class="mt-4 flex justify-between text-xs uppercase tracking-[0.4em] text-white/40">
                <span>{{ resolveType(item) }}</span>
                <BaseButton size="xs" variant="secondary" @click="inspectBundleItem(item)">Detalhes</BaseButton>
              </div>
            </article>
          </div>
          <div v-else class="rounded-3xl border border-white/5 px-4 py-6 text-center text-white/70">
            Nenhum item listado pelo backend para este bundle.
          </div>

          <div class="flex justify-end gap-3">
            <BaseButton variant="secondary" @click="closeModal">Fechar</BaseButton>
            <BaseButton
              :disabled="!isAuthenticated"
              @click="() => { addBundle(inspectBundle); closeModal(); }"
            >
              {{ isAuthenticated ? "Adicionar ao carrinho" : "Entre para comprar" }}
            </BaseButton>
          </div>
        </div>
      </template>
    </ModalShell>
  </section>
</template>