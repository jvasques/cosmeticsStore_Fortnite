<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { fetchPublicProfile } from "../services/userService.js";
import UserCard from "../components/UserCard.vue";
import InventoryTable from "../components/InventoryTable.vue";
import TransactionTable from "../components/TransactionTable.vue";

const route = useRoute();
const profile = ref(null);
const inventory = ref([]);
const transactions = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await fetchPublicProfile(route.params.id);
    profile.value = data?.user ?? data ?? null;
    inventory.value = Array.isArray(data?.items) ? data.items : data?.inventory ?? [];
    transactions.value = Array.isArray(data?.transactions) ? data.transactions : [];
  } catch (err) {
    error.value = "Não foi possível carregar este jogador.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="space-y-6">
    <header class="glass-panel px-6 py-4">
      <p class="text-xs uppercase tracking-[0.4em] text-white/50">Perfil público</p>
      <h1 class="text-3xl font-black text-white">Jogador</h1>
      <p class="text-sm text-white/60">Visualize o inventário e histórico público do jogador.</p>
    </header>

    <div v-if="loading" class="text-white/60">Carregando...</div>
    <p v-else-if="error" class="text-rose-300">{{ error }}</p>
    <div v-else-if="!profile" class="text-white/60">Jogador não encontrado.</div>
    <div v-else class="space-y-6">
      <UserCard :user="profile" />
      <div class="grid gap-6 lg:grid-cols-2">
        <InventoryTable :items="inventory" />
        <TransactionTable :transactions="transactions" />
      </div>
    </div>
  </section>
</template>