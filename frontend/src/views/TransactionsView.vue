<script setup>
import { computed, onMounted, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import TransactionTable from "../components/TransactionTable.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import { useAuthStore } from "../stores/authStore.js";

const authStore = useAuthStore();
const router = useRouter();
const state = reactive({ error: null, initialized: false });

const balance = computed(() => authStore.balance);
const updatedAt = computed(() => authStore.wallet.updatedAt ?? authStore.wallet.updated_at ?? null);
const transactions = computed(() => authStore.wallet.transactions ?? []);

async function loadTransactions() {
  if (!authStore.isAuthenticated) {
    state.error = null;
    return;
  }
  state.error = null;
  try {
    await authStore.refreshWallet({ limit: 100 });
    state.initialized = true;
  } catch (err) {
    state.error = err;
  }
}

function goToAuth() {
  router.push({ name: "auth" });
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    loadTransactions();
  }
});

watch(
  () => authStore.isAuthenticated,
  (logged) => {
    if (logged) {
      loadTransactions();
    } else {
      state.initialized = false;
    }
  }
);

const formattedUpdatedAt = computed(() => {
  if (!updatedAt.value) {
    return "—";
  }
  try {
    return new Date(updatedAt.value).toLocaleString("pt-BR");
  } catch {
    return updatedAt.value;
  }
});
</script>

<template>
  <section class="space-y-6">
    <header class="glass-panel px-6 py-4">
      <p class="text-xs uppercase tracking-[0.4em] text-white/50">Transações</p>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <h1 class="text-2xl font-black text-white sm:text-3xl">Histórico e saldo</h1>
          <p class="text-sm text-white/60">Atualizado em: {{ formattedUpdatedAt }}</p>
        </div>
        <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left sm:text-right">
          <p class="text-xs uppercase tracking-[0.4em] text-white/50">Saldo atual</p>
          <p class="text-2xl font-black text-brand-light sm:text-3xl">
            {{ balance.toLocaleString("pt-BR") }} VB
          </p>
        </div>
      </div>
    </header>

    <div v-if="!authStore.isAuthenticated" class="glass-panel space-y-4 px-6 py-8 text-center">
      <p class="text-white/80">Entre para visualizar suas transações e saldo.</p>
      <BaseButton @click="goToAuth">Fazer login</BaseButton>
    </div>

    <div v-else>
      <div v-if="authStore.walletLoading && !state.initialized" class="glass-panel px-6 py-8 text-center">
        <p class="text-white/70">Carregando transações...</p>
      </div>
      <div v-else-if="state.error" class="glass-panel space-y-4 px-6 py-8 text-center">
        <p class="text-white">Não foi possível carregar seu histórico.</p>
        <BaseButton variant="secondary" @click="loadTransactions">Tentar novamente</BaseButton>
      </div>
      <div v-else class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-white/60">Últimas {{ transactions.length }} transações</p>
          <BaseButton
            variant="secondary"
            size="sm"
            :disabled="authStore.walletLoading"
            @click="loadTransactions"
          >
            {{ authStore.walletLoading ? "Atualizando..." : "Atualizar" }}
          </BaseButton>
        </div>
        <TransactionTable :transactions="transactions" />
      </div>
    </div>
  </section>
</template>