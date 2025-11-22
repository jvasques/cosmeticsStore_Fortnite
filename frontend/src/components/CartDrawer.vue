<script setup>
import BaseButton from "./ui/BaseButton.vue";
import PriceTag from "./ui/PriceTag.vue";
import { computed } from "vue";
import { useCartStore } from "../stores/cartStore.js";

const cartStore = useCartStore();

const totalRegular = computed(() =>
  cartStore.items.reduce(
    (sum, item) => sum + Number(item.regularPrice ?? item.regular_price ?? item.final_price ?? 0),
    0
  )
);
const totalFinal = computed(() =>
  cartStore.items.reduce(
    (sum, item) => sum + Number(item.finalPrice ?? item.final_price ?? item.regular_price ?? 0),
    0
  )
);

const checkoutDisabled = computed(() => !cartStore.items.length || cartStore.processing);
const clearDisabled = computed(() => !cartStore.items.length || cartStore.processing);

const resolveErrorMessage = (error) => {
  if (!error) {
    return null;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error?.message === "string") {
    return error.message;
  }
  if (typeof error?.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return "Não foi possível finalizar a compra.";
};

const formatBundleName = (item) => {
  const fallbackCount = item.items?.length ?? item.contents?.length ?? 0;
  return (
    item.bundleName ??
    item.bundle_name ??
    item.name ??
    (fallbackCount ? `Pacotão ${fallbackCount} cosmetics` : "Bundle especial")
  );
};

const resolveUnitPrice = (item) =>
  Number(item.finalPrice ?? item.final_price ?? item.regular_price ?? item.regularPrice ?? 0);

const formatUnitPrice = (item) => `${resolveUnitPrice(item).toLocaleString("pt-BR")} VB`;
</script>

<template>
  <aside class="glass-panel sticky top-28 flex max-h-[75vh] flex-col gap-4 p-5">
    <header>
      <p class="text-xs uppercase tracking-[0.4em] text-white/60">Carrinho</p>
      <h3 class="text-2xl font-black text-white">{{ cartStore.items.length }} itens</h3>
    </header>

    <div class="flex-1 space-y-3 overflow-y-auto pr-2">
      <p v-if="!cartStore.items.length" class="text-sm text-white/60">
        Adicione cosméticos ou bundles para finalizar a compra através do endpoint `/me/shop/purchase`.
      </p>
      <article
        v-for="item in cartStore.items"
        :key="item.id ?? item.offerId"
        class="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2"
      >
        <div>
          <p class="font-semibold text-white">{{ formatBundleName(item) }}</p>
          <p class="text-xs uppercase tracking-[0.4em] text-white/40">
            {{ item.type ?? "bundle" }} · {{ formatUnitPrice(item) }}
          </p>
        </div>
        <button
          class="text-sm font-semibold text-white/60 transition hover:text-white"
          type="button"
          @click="cartStore.remove(item)"
        >
          remover
        </button>
      </article>
    </div>

    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <PriceTag :regular="totalRegular || totalFinal" :final="totalFinal" />
      <p v-if="cartStore.checkoutError" class="mt-2 text-xs text-rose-300">
        {{ resolveErrorMessage(cartStore.checkoutError) }}
      </p>
    </div>

    <div class="flex flex-col gap-2 md:flex-row">
      <BaseButton variant="ghost" class="w-full" :disabled="clearDisabled" @click="cartStore.clear()">
        Limpar carrinho
      </BaseButton>
      <BaseButton class="w-full" :disabled="checkoutDisabled" @click="cartStore.checkout()">
        {{ cartStore.processing ? "Processando..." : "Finalizar compra" }}
      </BaseButton>
    </div>
  </aside>
</template>