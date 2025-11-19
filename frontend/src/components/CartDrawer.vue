<script setup>
import BaseButton from "./ui/BaseButton.vue";
import PriceTag from "./ui/PriceTag.vue";
import { computed } from "vue";
import { useCartStore } from "../stores/cartStore.js";

const cartStore = useCartStore();

const totalRegular = computed(() => cartStore.items.reduce((sum, item) => sum + (item.regularPrice ?? item.regular_price ?? 0), 0));
const totalFinal = computed(() => cartStore.items.reduce((sum, item) => sum + (item.finalPrice ?? item.final_price ?? item.regular_price ?? 0), 0));
</script>

<template>
  <aside class="glass-panel sticky top-28 flex max-h-[75vh] flex-col gap-4 p-5">
    <header>
      <p class="text-xs uppercase tracking-[0.4em] text-white/60">Carrinho</p>
      <h3 class="text-2xl font-black text-white">{{ cartStore.items.length }} itens</h3>
    </header>

    <div class="flex-1 space-y-3 overflow-y-auto pr-2">
      <p v-if="!cartStore.items.length" class="text-sm text-white/60">
        Adicione cosméticos ou bundles para concluir compras quando o backend liberar o endpoint `/store/purchase`.
      </p>
      <article
        v-for="item in cartStore.items"
        :key="item.id ?? item.offerId"
        class="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2"
      >
        <div>
          <p class="font-semibold text-white">{{ item.name ?? item.bundleName }}</p>
          <p class="text-xs uppercase tracking-[0.4em] text-white/40">{{ item.type ?? 'bundle' }}</p>
        </div>
        <button
          class="text-sm font-semibold text-white/60 transition hover:text-white"
          type="button"
          @click="cartStore.remove(item.id ?? item.offerId)"
        >
          remover
        </button>
      </article>
    </div>

    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <PriceTag :regular="totalRegular || totalFinal" :final="totalFinal" />
    </div>

    <BaseButton :disabled="!cartStore.items.length" @click="cartStore.checkout()">
      Checkout (mock)
    </BaseButton>
  </aside>
</template>