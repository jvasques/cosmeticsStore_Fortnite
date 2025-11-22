<script setup>
import { computed } from "vue";
import BaseButton from "./ui/BaseButton.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  secondaryLabel: {
    type: String,
    default: null,
  },
  showDetails: {
    type: Boolean,
    default: false,
  },
  detailsLabel: {
    type: String,
    default: "Detalhes",
  },
  disableDetails: {
    type: Boolean,
    default: false,
  },
  showSell: {
    type: Boolean,
    default: false,
  },
  sellLabel: {
    type: String,
    default: "Vender",
  },
  disableSell: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["details", "sell"]);

const cover = computed(() =>
  props.item?.image_icon ??
  props.item?.image_feature ??
  props.item?.image_small_icon ??
  props.item?.images?.icon ??
  props.item?.images?.featured ??
  props.item?.images?.smallIcon ??
  null,
);

const rarity = computed(() => (props.item?.rarity_value ?? props.item?.rarity ?? "common"));
const typeLabel = computed(() => props.item?.type_value ?? props.item?.type ?? "item");
const name = computed(() => props.item?.name ?? props.item?.display_name ?? "Cosmético");
const description = computed(
  () => props.item?.description ?? props.item?.summary ?? props.item?.details ?? "Sem descrição disponível.",
);
</script>

<template>
  <article class="flex h-full flex-col rounded-3xl border border-white/5 bg-white/5 p-4">
    <div class="flex items-start gap-4">
      <img v-if="cover" :src="cover" :alt="name" class="h-16 w-16 flex-shrink-0 rounded-2xl object-cover" />
      <div class="flex min-h-[68px] w-full flex-col justify-between gap-1">
        <p class="text-[11px] uppercase tracking-[0.4em] text-white/50">{{ rarity }}</p>
        <p class="text-base font-semibold leading-tight text-white line-clamp-1">{{ name }}</p>
        <p class="text-sm text-white/60 line-clamp-2">{{ description }}</p>
      </div>
    </div>
    <div class="mt-4 flex flex-1 flex-wrap items-end justify-between gap-3 text-[11px] uppercase tracking-[0.35em] text-white/40">
      <span class="text-white/50">{{ typeLabel }}</span>
      <slot name="actions">
        <div class="flex flex-col items-end gap-2 text-right">
          <span v-if="secondaryLabel" class="text-[10px] uppercase tracking-[0.35em] text-white/50">{{ secondaryLabel }}</span>
          <div class="flex w-full flex-row items-end gap-2">
            <BaseButton
              v-if="props.showDetails"
              size="xs"
              variant="secondary"
              class="min-w-[120px] justify-center"
              :disabled="props.disableDetails"
              @click="emit('details', props.item)"
            >
              {{ props.detailsLabel }}
            </BaseButton>
            <BaseButton
              v-if="props.showSell"
              size="xs"
              variant="primary"
              class="min-w-[120px] justify-center"
              :disabled="props.disableSell"
              @click="emit('sell', props.item)"
            >
              {{ props.sellLabel }}
            </BaseButton>
          </div>
        </div>
      </slot>
    </div>
  </article>
</template>
