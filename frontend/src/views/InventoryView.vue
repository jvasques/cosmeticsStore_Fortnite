<script setup>
import InventoryTable from "../components/InventoryTable.vue";
import { mockCosmetics } from "../mock/catalog.js";

const inventory = mockCosmetics.map((item, index) => ({
  id: item.id,
  name: item.name,
  type: item.type,
  source: index % 2 === 0 ? "Loja" : "Bundle",
  quantity: 1,
  acquiredAt: new Date(Date.now() - index * 86400000).toLocaleDateString("pt-BR"),
}));
</script>

<template>
  <section class="space-y-6">
    <header class="glass-panel px-6 py-4">
      <p class="text-xs uppercase tracking-[0.4em] text-white/50">Inventário</p>
      <h1 class="text-3xl font-black text-white">Seus itens</h1>
      <p class="text-sm text-white/60">Integração real aguardando endpoint `/inventory`.</p>
    </header>

    <InventoryTable :items="inventory" />
  </section>
</template>