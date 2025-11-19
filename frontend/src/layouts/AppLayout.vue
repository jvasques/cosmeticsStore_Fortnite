<script setup>
import { RouterLink, useRoute, useRouter } from "vue-router";
import { WalletIcon, ArrowRightOnRectangleIcon } from "@heroicons/vue/24/outline";
import ThemeToggle from "../components/ui/ThemeToggle.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import CartDrawer from "../components/CartDrawer.vue";
import { useAuthStore } from "../stores/authStore.js";
import { useCartStore } from "../stores/cartStore.js";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();

const links = [
  { label: "Showroom", to: { name: "showroom" } },
  { label: "Bundles", to: { name: "bundles" } },
  { label: "Inventário", to: { name: "inventory" } },
  { label: "Transações", to: { name: "transactions" } },
  { label: "Diretório", to: { name: "directory" } },
];

function goToAuth() {
  router.push({ name: "auth" });
}

function logout() {
  authStore.logout();
  goToAuth();
}
</script>

<template>
  <div class="min-h-screen bg-[#04050a] text-white">
    <div class="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-16 pt-8 lg:px-8">
      <header
        class="glass-panel sticky top-4 z-30 flex flex-wrap items-center justify-between gap-4 border border-white/10 px-6 py-4"
      >
        <div class="flex items-center gap-4">
          <RouterLink to="/" class="text-xl font-black tracking-tight">
            cosmetics<span class="text-brand-light">.store</span>
          </RouterLink>
          <nav class="flex flex-wrap gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
            <RouterLink
              v-for="link in links"
              :key="link.label"
              :to="link.to"
              class="rounded-full px-3 py-1 transition"
              :class="route.name === link.to.name ? 'bg-white/10 text-white' : 'hover:bg-white/5'"
            >
              {{ link.label }}
            </RouterLink>
          </nav>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
            <WalletIcon class="h-5 w-5 text-brand-light" />
            <div>
              <p class="text-xs uppercase tracking-[0.4em] text-white/50">Saldo</p>
              <p class="text-lg font-black">{{ authStore.balance.toLocaleString('pt-BR') }} VB</p>
            </div>
          </div>
          <ThemeToggle />
          <BaseButton
            v-if="authStore.isAuthenticated"
            variant="ghost"
            size="sm"
            @click="logout"
          >
            <ArrowRightOnRectangleIcon class="h-4 w-4" />
            Sair
          </BaseButton>
          <BaseButton v-else size="sm" @click="goToAuth">Entrar</BaseButton>
        </div>
      </header>

      <section class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main class="space-y-8">
          <slot />
        </main>
        <CartDrawer class="hidden xl:flex" />
      </section>

      <transition name="fade">
        <div
          v-if="cartStore.toast"
          class="pointer-events-none fixed bottom-6 right-6 rounded-3xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-card"
        >
          {{ cartStore.toast }}
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>