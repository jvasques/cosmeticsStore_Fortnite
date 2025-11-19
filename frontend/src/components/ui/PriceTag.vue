<script setup>
import { computed } from "vue";
const props = defineProps({
  regular: {
    type: Number,
    required: true,
  },
  final: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "VB",
  },
});

const savings = computed(() => {
  if (!props.regular || props.regular <= props.final) {
    return null;
  }
  const value = ((props.regular - props.final) / props.regular) * 100;
  return Math.round(value);
});
</script>

<template>
  <div class="flex flex-col text-right text-white">
    <div class="text-xs uppercase tracking-[0.3em] text-white/60">{{ props.currency }}</div>
    <div class="flex items-baseline gap-2">
      <span class="text-2xl font-black">{{ props.final.toLocaleString() }}</span>
      <span
        v-if="props.regular !== props.final"
        class="text-sm font-semibold text-white/50 line-through"
      >
        {{ props.regular.toLocaleString() }}
      </span>
    </div>
    <span v-if="savings" class="text-xs font-semibold text-accent-success">Economize {{ savings }}%</span>
  </div>
</template>