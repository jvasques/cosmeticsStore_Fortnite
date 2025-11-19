<script setup>
import { onMounted } from "vue";
import { useCatalogStore } from "../stores/catalogStore.js";
import BundleCard from "../components/BundleCard.vue";
import { useCartStore } from "../stores/cartStore.js";

const catalogStore = useCatalogStore();
const cartStore = useCartStore();

onMounted(() => {
  if (!catalogStore.bundles.length) {
    catalogStore.loadCatalog();
  }
});

function inspect(bundle) {
  console.info("Inspect bundle", bundle);
}

function addBundle(bundle) {
  cartStore.add({
    offerId: bundle.offerId,
    bundleName: bundle.bundleName,
    regularPrice: bundle.regularPrice,
    finalPrice: bundle.finalPrice,
    type: "bundle",
  });
}
</script>

<template>
  <section class="space-y-6">
    <header class="glass-panel px-6 py-4">
      <p class="text-xs uppercase tracking-[0.4em] text-white/50">Bundles</p>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-3xl font-black text-white">Ofertas da loja</h1>
        <p class="text-sm text-white/60">{{ catalogStore.bundles.length }} bundles disponíveis</p>
      </div>
    </header>

    <div class="grid gap-5 md:grid-cols-2">
      <BundleCard
        v-for="bundle in catalogStore.bundles"
        :key="bundle.offerId"
        :bundle="bundle"
        :owned="false"
        @inspect="inspect"
        @purchase="addBundle"
      />
    </div>
  </section>
</template>