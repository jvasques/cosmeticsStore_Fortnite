<script setup>
import { computed } from "vue";
import BaseBadge from "./ui/BaseBadge.vue";
import BaseButton from "./ui/BaseButton.vue";
import PriceTag from "./ui/PriceTag.vue";

const props = defineProps({
  cosmetic: { type: Object, required: true },
  owned: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false },
  isOnSale: { type: Boolean, default: false },
  isPromo: { type: Boolean, default: false },
  inCart: { type: Boolean, default: false },
  purchasable: { type: Boolean, default: true },
  price: { type: Object, default: null },
  authLocked: { type: Boolean, default: false },
});

const emit = defineEmits(["inspect", "add-to-cart"]);

const cover = computed(
  () => props.cosmetic?.images?.icon ?? props.cosmetic?.images?.smallIcon
);
const rarity = computed(
  () => props.cosmetic?.rarity ?? props.cosmetic?.rarity_value ?? "common"
);
const rarityKey = computed(() => `${rarity.value ?? "common"}`.toLowerCase());

function normalizePriceValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

const finalPrice = computed(() => {
  if (!props.price) return null;
  return (
    normalizePriceValue(props.price.finalPrice) ??
    normalizePriceValue(props.price.final_price) ??
    normalizePriceValue(props.price.regularPrice) ??
    normalizePriceValue(props.price.regular_price) ??
    null
  );
});

const regularPrice = computed(() => {
  if (!props.price) return null;
  return (
    normalizePriceValue(props.price.regularPrice) ??
    normalizePriceValue(props.price.regular_price) ??
    finalPrice.value
  );
});

const showPriceTag = computed(
  () => finalPrice.value !== null && regularPrice.value !== null
);

const showPromoBadge = computed(() => {
  if (props.isPromo) return true;
  if (!showPriceTag.value) return false;
  return finalPrice.value < regularPrice.value;
});

const rarityMap = {
  legendary: "from-amber-500/80 to-orange-500/40",
  epic: "from-purple-500/80 to-indigo-500/30",
  rare: "from-sky-500/80 to-blue-500/30",
  uncommon: "from-emerald-500/80 to-green-500/30",
  common: "from-zinc-500/60 to-slate-500/30",
};
</script>

<template>
  <article
    class="group relative flex flex-col h-full overflow-hidden rounded-3xl border border-white/5 bg-surface-card/80 p-4 shadow-card transition hover:-translate-y-1 hover:border-white/20"
  >
    <div
      class="relative h-48 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-surface-light to-surface-dark"
    >
      <img
        v-if="cover"
        :src="cover"
        :alt="props.cosmetic?.name"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      <div class="absolute left-3 top-3 flex flex-wrap gap-2">
        <BaseBadge v-if="props.isNew" variant="success">Novo</BaseBadge>
        <BaseBadge v-if="props.isOnSale" variant="warning">Loja</BaseBadge>
        <BaseBadge v-if="showPromoBadge" variant="promo">Promoção</BaseBadge>
        <BaseBadge v-if="props.inCart" variant="neutral">No carrinho</BaseBadge>
        <BaseBadge v-if="props.owned" variant="neutral">Adquirido</BaseBadge>
      </div>
    </div>

    <div class="mt-4 flex flex-col gap-3 flex-1">
      <div>
        <p class="text-xs uppercase tracking-[0.5em] text-white/40">
          {{ rarity }}
        </p>

        <h3 class="text-xl font-bold text-white">
          {{ props.cosmetic?.name }}
        </h3>

        <p class="text-sm text-white/60 line-clamp-2">
          {{ props.cosmetic?.description }}
        </p>
      </div>

      <div v-if="showPriceTag" class="flex justify-end">
        <PriceTag :regular="regularPrice" :final="finalPrice" />
      </div>
    </div>

    <div class="flex items-center justify-between gap-3 mt-4">
      <BaseButton variant="secondary" size="sm" @click="emit('inspect', props.cosmetic)">
        Detalhes
      </BaseButton>

      <BaseButton
        v-if="props.purchasable || props.inCart"
        size="sm"
        :disabled="props.owned || props.inCart || !props.purchasable || props.authLocked"
        @click="emit('add-to-cart', props.cosmetic)"
      >
        <template v-if="props.owned">No inventário</template>
        <template v-else-if="props.inCart">No carrinho</template>
        <template v-else-if="props.authLocked">Entre para comprar</template>
        <template v-else>Adquirir</template>
      </BaseButton>
    </div>

    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-1 w-full bg-gradient-to-r"
      :class="rarityMap[rarityKey.value] ?? rarityMap.common"
    />
  </article>
</template>