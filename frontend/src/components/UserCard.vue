<script setup>
import { computed } from "vue";
import placeholderAvatar from "../assets/placeholder.svg";

const PLACEHOLDER = placeholderAvatar;
const dateFormatter = new Intl.DateTimeFormat("pt-BR");

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});

const MAX_NAME_LENGTH = 15;

function truncateDisplayName(name) {
  if (!name || typeof name !== "string") {
    return "Jogador anônimo";
  }
  if (name.length <= MAX_NAME_LENGTH) {
    return name;
  }
  if (MAX_NAME_LENGTH <= 3) {
    return "...";
  }
  return `${name.slice(0, MAX_NAME_LENGTH - 3)}...`;
}

const displayName = computed(() => truncateDisplayName(props.user.displayName ?? props.user.name ?? "Jogador anônimo"));
const createdAtLabel = computed(() => formatDate(props.user.createdAt ?? props.user.created_at));
const avatar = computed(() => props.user.avatar ?? props.user.image ?? PLACEHOLDER);

function formatDate(value) {
  if (!value) {
    return "Data indisponível";
  }
  try {
    return dateFormatter.format(new Date(value));
  } catch (error) {
    return "Data indisponível";
  }
}
</script>

<template>
  <article class="glass-panel flex items-center gap-4 p-5">
    <div class="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <img :src="avatar" :alt="displayName" class="h-full w-full object-contain p-2" />
    </div>
    <div class="flex-1">
      <h4 class="text-xl font-semibold text-white">{{ displayName }}</h4>
      <p class="text-sm text-white/60">Registrado em: {{ createdAtLabel }}</p>
      <p class="text-sm text-white/60">Saldo: {{ (props.user.balance ?? "Indisponível").toLocaleString('pt-BR') }} V-bucks</p>
    </div>
    <slot />
  </article>
</template>