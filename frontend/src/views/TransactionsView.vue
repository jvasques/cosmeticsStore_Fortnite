<script setup>
import TransactionTable from "../components/TransactionTable.vue";

const transactions = [
  { id: "tx-1", createdAt: "2025-11-18", type: "credit", description: "Bônus de boas-vindas", amount: 10000 },
  { id: "tx-2", createdAt: "2025-11-19", type: "debit", description: "Compra bundle Legado Cósmico", amount: -2400 },
];
</script>

<template>
  <section class="space-y-6">
    <header class="glass-panel px-6 py-4">
      <p class="text-xs uppercase tracking-[0.4em] text-white/50">Transações</p>
      <h1 class="text-3xl font-black text-white">Histórico e saldo</h1>
      <p class="text-sm text-white/60">Integração aguardando endpoint `/me/wallet` com `transactions`.</p>
    </header>

    <TransactionTable :transactions="transactions" />
  </section>
</template>