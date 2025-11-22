<script setup>
import { computed, ref } from "vue";
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
  authLocked: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["inspect", "purchase"]);

const countdown = ref("—");
let intervalId = null;

function resolveBundleName(bundle) {
  if (!bundle) {
    return "Bundle";
  }

  return (
    bundle.bundleName ??
    bundle.bundle_name ??
    bundle.name ??
    buildItemNameList(bundle.items)
  );
}

function resolveBundleDescription(bundle) {
  if (!bundle) {
    return "Sem descrição disponível.";
  }

  const description = bundle.description;
  if (description) {
    return description;
  }

  const itemList = buildItemNameList(bundle.items);
  if (itemList) {
    return itemList;
  }

  const itemCount = bundle.items?.length ?? 0;
  return itemCount ? `Pacote com ${itemCount} itens` : "Sem descrição disponível.";
}

function buildItemNameList(items = []) {
  if (!Array.isArray(items) || !items.length) {
    return "";
  }
  const names = items
    .map((item) => item?.name)
    .filter(Boolean)
    .slice(0, 3);

  if (!names.length) {
    return "";
  }

  if (items.length > 3) {
    const remaining = items.length - 3;
    return `${names.join(" + ")} + ${remaining} outros`;
  }

  return names.join(" + ");
}

const isPromo = computed(() => {
  const b = props.bundle
  if (!b) return false

  const regular = b.regularPrice ?? b.regular_price
  const final   = b.finalPrice   ?? b.final_price

  if (regular == null || final == null) return false

  return final < regular
})

const resolveDate = (bundle) => {
  const raw = bundle?.out_date;
  if (!raw) return "—";

  const date = new Date(raw);
  return isNaN(date.getTime()) ? raw : date.toLocaleDateString("pt-BR");
};
</script>

<template>
  <article class="glass-panel flex flex-col gap-4 p-5 h-full">
    <header class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.5em] text-white/50">Bundle</p>
        <h3 class="text-2xl font-black text-white">{{ resolveBundleName(props.bundle) }}</h3>
        <p class="text-sm text-white/60">{{ resolveBundleDescription(props.bundle) }}</p>
        <p class="text-sm text-white/60">Disponível Até: {{ resolveDate(props.bundle) }}</p>
      </div>
      <PriceTag
        :regular="props.bundle.regularPrice ?? props.bundle.regular_price ?? props.bundle.final_price"
        :final="props.bundle.finalPrice ?? props.bundle.final_price ?? props.bundle.regular_price"
      />
    </header>

    <div class="flex flex-wrap gap-2">
      <BaseBadge v-if="isPromo" variant="warning">Promoção</BaseBadge>
      <BaseBadge v-if="props.owned" variant="neutral">Adquirido</BaseBadge>
    </div>

    <div class="mt-auto flex flex-wrap gap-3 justify-between">
      <BaseButton variant="secondary" size="sm" @click="emit('inspect', props.bundle)">
        Detalhes
      </BaseButton>
      <BaseButton
        size="sm"
        :disabled="props.owned || props.authLocked"
        @click="emit('purchase', props.bundle)">
        <template v-if="props.owned">No inventário</template>
        <template v-else-if="props.authLocked">Entre para comprar</template>
        <template v-else>Comprar bundle</template>
      </BaseButton>
    </div>
  </article>
</template>