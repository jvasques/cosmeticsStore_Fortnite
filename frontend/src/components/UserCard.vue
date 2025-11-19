<script setup>
const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <article class="glass-panel flex items-center gap-4 p-5">
    <div class="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand to-brand-light text-2xl font-black text-white flex items-center justify-center">
      {{ props.user.displayName?.charAt(0)?.toUpperCase() ?? 'U' }}
    </div>
    <div class="flex-1">
      <p class="text-sm uppercase tracking-[0.4em] text-white/50">{{ props.user.region ?? 'GLOBAL' }}</p>
      <h4 class="text-xl font-semibold text-white">{{ props.user.displayName ?? props.user.name }}</h4>
      <p class="text-white/60">Itens: {{ props.user.totalItems ?? 0 }}</p>
    </div>
    <slot />
  </article>
</template>