<script setup>
import { onMounted, ref } from "vue";
import { useCatalogStore } from "../stores/catalogStore.js";
import CosmeticCard from "../components/CosmeticCard.vue";
import BaseBadge from "../components/ui/BaseBadge.vue";
import SkeletonBlock from "../components/ui/SkeletonBlock.vue";
import ModalShell from "../components/ui/ModalShell.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import { useCartStore } from "../stores/cartStore.js";

const catalogStore = useCatalogStore();
const cartStore = useCartStore();
const inspectCosmetic = ref(null);

onMounted(() => {
  if (!catalogStore.cosmetics.length) {
    catalogStore.loadCatalog();
  }
});

const hasSaleFlag = (cosmetic) => Boolean(cosmetic.is_on_sale ?? cosmetic.isOnSale);
const hasNewFlag = (cosmetic) => Boolean(cosmetic.is_new ?? cosmetic.isNew);

function handleInspect(cosmetic) {
  inspectCosmetic.value = cosmetic;
}

function closeModal() {
  inspectCosmetic.value = null;
}

function addToCart(cosmetic) {
  cartStore.add({
    id: cosmetic.id,
    name: cosmetic.name,
    type: cosmetic.type,
    regularPrice: cosmetic.price ?? 1200,
    finalPrice: cosmetic.price ?? 1200,
  });
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
        <BaseBadge variant="success">{{ catalogStore.filteredCosmetics.length }} itens</BaseBadge>
        <BaseBadge variant="warning">Filtros em breve</BaseBadge>
      </div>
    </header>

    <div v-if="catalogStore.loading" class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <SkeletonBlock v-for="i in 6" :key="i" class="h-64" />
    </div>

    <div v-else class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <CosmeticCard
        v-for="cosmetic in catalogStore.filteredCosmetics"
        :key="cosmetic.id"
        :cosmetic="cosmetic"
        :is-new="hasNewFlag(cosmetic)"
        :is-on-sale="hasSaleFlag(cosmetic)"
        :owned="false"
        @inspect="handleInspect"
        @add-to-cart="addToCart"
      />
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
            </div>
            <header>
              <p class="text-xs uppercase tracking-[0.4em] text-white/50">
                {{ inspectCosmetic.rarity ?? inspectCosmetic.rarity_value }} · {{ inspectCosmetic.type ?? inspectCosmetic.type_value }}
              </p>
              <h2 class="text-3xl font-black text-white">{{ inspectCosmetic.name }}</h2>
            </header>
            <p class="text-white/70">
              {{ inspectCosmetic.description ?? "Sem descrição disponível." }}
            </p>
            <div class="flex flex-wrap gap-3">
              <BaseButton variant="secondary" @click="closeModal">Fechar</BaseButton>
              <BaseButton @click="() => { addToCart(inspectCosmetic); closeModal(); }">
                Adicionar ao carrinho
              </BaseButton>
            </div>
          </div>
        </div>
      </template>
    </ModalShell>
  </section>
</template>