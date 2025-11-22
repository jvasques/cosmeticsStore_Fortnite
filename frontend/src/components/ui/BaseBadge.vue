<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: "info",
  },
  pill: {
    type: Boolean,
    default: true,
  },
});

const variants = {
  info: "bg-accent-info/20 text-accent-info border border-accent-info/30",
  success: "bg-accent-success/20 text-accent-success border border-accent-success/30",
  warning: "bg-accent-warning/20 text-accent-warning border border-accent-warning/30",
  neutral: "bg-white/10 text-white border border-white/10",
  promo: "bg-rose-500/20 text-rose-100 border border-rose-400/30",
};
</script>

<template>
  <span
    :class="[
      'inline-flex items-center text-xs font-semibold uppercase tracking-wide px-2 py-1',
      props.pill ? 'rounded-full' : 'rounded-md',
      variants[props.variant] ?? variants.info,
    ]"
  >
    <slot />
  </span>
</template>