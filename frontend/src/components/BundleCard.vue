<script setup>
import BaseBadge from "./ui/BaseBadge.vue";
import BaseButton from "./ui/BaseButton.vue";
import PriceTag from "./ui/PriceTag.vue";

const props = defineProps({
  bundle: {
    type: Object,
    required: true,
  },
  owned: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["inspect", "purchase"]);
</script>

<template>
  <article class="glass-panel flex flex-col gap-4 p-5">
    <header class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.5em] text-white/50">Bundle</p>
        <h3 class="text-2xl font-black text-white">{{ props.bundle.bundleName ?? props.bundle.name }}</h3>
        <p class="text-sm text-white/60">{{ props.bundle.description }}</p>
      </div>
      <PriceTag
        :regular="props.bundle.regularPrice ?? props.bundle.regular_price ?? props.bundle.final_price"
        :final="props.bundle.finalPrice ?? props.bundle.final_price ?? props.bundle.regular_price"
      />
    </header>

    <div class="flex flex-wrap gap-2">
      <BaseBadge v-if="props.bundle.isPromo" variant="warning">Promoção</BaseBadge>
      <BaseBadge v-if="props.owned" variant="neutral">Adquirido</BaseBadge>
    </div>

    <div class="flex flex-wrap gap-3">
      <BaseButton variant="secondary" size="sm" @click="emit('inspect', props.bundle)">
        Detalhes
      </BaseButton>
      <BaseButton
        size="sm"
        :disabled="props.owned"
        @click="emit('purchase', props.bundle)">
        {{ props.owned ? 'No inventário' : 'Comprar bundle' }}
      </BaseButton>
    </div>
  </article>
</template>