<script setup>
const props = defineProps({
  transactions: {
    type: Array,
    default: () => [],
  },
});

const typeLabels = {
  credit: "Crédito",
  debit: "Débito",
};
</script>

<template>
  <div class="glass-panel overflow-hidden">
    <table class="min-w-full divide-y divide-white/5">
      <thead class="bg-white/5">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
            Data
          </th>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
            Tipo
          </th>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
            Descrição
          </th>
          <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/60">
            Valor
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        <tr v-if="!props.transactions.length">
          <td colspan="4" class="px-6 py-8 text-center text-white/60">
            Sem movimentações ainda.
          </td>
        </tr>
        <tr v-for="tx in props.transactions" :key="tx.id" class="hover:bg-white/5">
          <td class="px-4 py-3 text-white/70">{{ tx.createdAt ?? tx.created_at ?? '—' }}</td>
          <td class="px-4 py-3">
            <span
              :class="[
                'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                (tx.type ?? '').includes('credit')
                  ? 'bg-accent-success/20 text-accent-success'
                  : 'bg-rose-500/10 text-rose-200',
              ]"
            >
              {{ typeLabels[tx.type] ?? tx.type }}
            </span>
          </td>
          <td class="px-4 py-3 text-white/80">{{ tx.description ?? '—' }}</td>
          <td class="px-4 py-3 text-right font-semibold" :class="tx.amount >= 0 ? 'text-accent-success' : 'text-rose-300'">
            {{ tx.amount >= 0 ? '+' : '' }}{{ tx.amount }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>