<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { fetchPublicProfile } from "../services/userService.js";
import UserCard from "../components/UserCard.vue";
import InventoryTable from "../components/InventoryTable.vue";
import TransactionTable from "../components/TransactionTable.vue";

const route = useRoute();
const profile = ref(null);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const data = await fetchPublicProfile(route.params.id);
    profile.value = data;
  } catch (err) {
    console.warn("Profile endpoint não disponível, usando mock", err);
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
      <p class="text-sm text-white/60">Endpoint `/users/:id` ainda não está disponível.</p>
    </header>

    <div v-if="loading" class="text-white/60">Carregando...</div>
    <div v-else>
      <UserCard
        :user="profile ?? { id: 'fake', displayName: 'MockPlayer', totalItems: 120, region: 'BR' }"
      />
      <div class="grid gap-6 lg:grid-cols-2">
        <InventoryTable :items="(profile?.inventory ?? [])" />
        <TransactionTable :transactions="(profile?.transactions ?? [])" />
      </div>
    </div>
  </section>
</template>