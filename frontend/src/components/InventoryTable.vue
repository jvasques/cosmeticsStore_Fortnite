<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: "Nenhum item no inventário ainda.",
  },
});

const resolveKey = (item) => {
  if (item.id || item.inventory_id || item.cosmetic_id || item.cosmeticId) {
    return item.id ?? item.inventory_id ?? item.cosmetic_id ?? item.cosmeticId;
  }
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const resolveName = (item) =>
  item.name ?? item.cosmetic_name ?? item.cosmeticId ?? item.cosmetic_id ?? "Cosmético";

const resolveType = (item) => item.type ?? item.type_value ?? item.cosmetic_type ?? "-";

const isBundleItem = (item) => item.metadata?.originType === "bundle" || item.origin === "bundle";

const resolveSource = (item) => {
  if (isBundleItem(item)) {
    const bundleName = item.metadata?.bundleName ?? item.bundleName ?? item.bundle_name;
    return bundleName ? `Bundle · ${bundleName}` : "Bundle";
  }
  return item.source ?? item.origin ?? item.metadata?.source ?? "Loja";
};

const resolveQuantity = (item) => item.quantity ?? item.qty ?? 1;

const resolveDate = (item) => {
  const raw = item.acquiredAt ?? item.acquired_at ?? item.created_at;
  if (!raw) {
    return "—";
  }
  try {
    return new Date(raw).toLocaleDateString("pt-BR");
  } catch {
    return raw;
  }
};
</script>

<template>
  <div class="glass-panel overflow-hidden">
    <table class="min-w-full divide-y divide-white/5">
      <thead class="bg-white/5">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
            Item
          </th>
          <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
            Origem
          </th>
          <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
            Quantidade
          </th>
          <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
            Desde
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        <tr v-if="!props.items.length">
          <td colspan="4" class="px-6 py-8 text-center text-white/60">
            {{ props.emptyLabel }}
          </td>
        </tr>
        <tr v-for="item in props.items" :key="resolveKey(item)" class="hover:bg-white/5">
          <td class="px-6 py-4">
            <p class="font-semibold text-white">{{ resolveName(item) }}</p>
            <p class="text-sm text-white/60">{{ resolveType(item) }}</p>
          </td>
          <td class="px-6 py-4 text-white/70">{{ resolveSource(item) }}</td>
          <td class="px-6 py-4 text-white/70">{{ resolveQuantity(item) }}</td>
          <td class="px-6 py-4 text-white/70">{{ resolveDate(item) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>