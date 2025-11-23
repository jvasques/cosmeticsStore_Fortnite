<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: "primary",
  },
  size: {
    type: String,
    default: "md",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  as: {
    type: String,
    default: "button",
  },
});

const baseClasses =
  "inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary:
    "bg-brand text-[#292C2B] hover:bg-brand-dark active:bg-brand-dark shadow-[0_8px_25px_rgba(51,204,153,0.35)]",
  secondary:
    "bg-white/10 text-white hover:bg-white/20 border border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.25)]",
  ghost: "bg-transparent text-white hover:bg-white/10",
  danger: "bg-gradient-to-r from-rose-500 to-red-500 text-white",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-2xl",
  md: "px-4 py-2 text-base rounded-2xl",
  lg: "px-6 py-3 text-lg rounded-3xl",
};
</script>

<template>
  <component
    :is="props.as"
    :disabled="props.loading || $attrs.disabled"
    :class="[
      baseClasses,
      variants[props.variant] ?? variants.primary,
      sizes[props.size] ?? sizes.md,
      props.loading && 'cursor-wait',
    ]"
    v-bind="$attrs"
  >
    <svg
      v-if="props.loading"
      class="h-4 w-4 animate-spin text-current"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
    <slot />
  </component>
</template>