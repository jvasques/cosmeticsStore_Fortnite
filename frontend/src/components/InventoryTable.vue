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
        <tr v-for="item in props.items" :key="item.id" class="hover:bg-white/5">
          <td class="px-6 py-4">
            <p class="font-semibold text-white">{{ item.name }}</p>
            <p class="text-sm text-white/60">{{ item.type }}</p>
          </td>
          <td class="px-6 py-4 text-white/70">{{ item.source }}</td>
          <td class="px-6 py-4 text-white/70">{{ item.quantity ?? 1 }}</td>
          <td class="px-6 py-4 text-white/70">{{ item.acquiredAt ?? '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>