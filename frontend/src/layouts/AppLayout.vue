<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { WalletIcon, ArrowRightOnRectangleIcon } from "@heroicons/vue/24/outline";
import BaseButton from "../components/ui/BaseButton.vue";
import CartDrawer from "../components/CartDrawer.vue";
import { useAuthStore } from "../stores/authStore.js";
import { useCartStore } from "../stores/cartStore.js";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const walletAnimated = ref(authStore.balance ?? 0);
const walletDisplay = computed(() => `${Math.round(walletAnimated.value).toLocaleString("pt-BR")} VB`);

const toastMessage = computed(() =>
  typeof cartStore.toast === "string" ? cartStore.toast : cartStore.toast?.message ?? ""
);
const toastVariant = computed(() =>
  typeof cartStore.toast === "object" && cartStore.toast?.type ? cartStore.toast.type : "success"
);
const toastClasses = computed(() =>
  toastVariant.value === "error"
    ? "border-rose-400/30 bg-rose-500/20 text-rose-50"
    : "border-emerald-400/30 bg-emerald-500/20 text-emerald-50"
);

let walletAnimationCancel = null;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function animateNumber({ from, to, duration = 800, onUpdate, onComplete }) {
  if (from === undefined || from === null) {
    from = 0;
  }
  if (to === undefined || to === null) {
    to = 0;
  }
  const start = performance.now();
  function frameHandler(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    onUpdate(from + (to - from) * eased);
    if (progress < 1) {
      return requestAnimationFrame(frameHandler);
    }
    onComplete?.();
    return null;
  }
  const frameId = requestAnimationFrame(frameHandler);
  return () => cancelAnimationFrame(frameId);
}

function runWalletAnimation(nextBalance) {
  walletAnimationCancel?.();
  walletAnimationCancel = animateNumber({
    from: walletAnimated.value,
    to: nextBalance,
    duration: 900,
    onUpdate: (value) => {
      walletAnimated.value = value;
    },
  });
}

watch(
  () => authStore.balance,
  (next) => {
    runWalletAnimation(next ?? 0);
  },
  { immediate: true },
);

const navConfig = [
  { label: "Showroom", to: { name: "showroom" } },
  { label: "Bundles", to: { name: "bundles" } },
  { label: "Inventário", to: { name: "inventory" }, requiresAuth: true },
  { label: "Transações", to: { name: "transactions" }, requiresAuth: true },
  { label: "Comunidade", to: { name: "community" } },
];

const links = computed(() =>
  navConfig.filter((link) => (link.requiresAuth ? authStore.isAuthenticated : true))
);

const isAuthRoute = computed(() => route.name === "auth");

function goToAuth() {
  router.push({ name: "auth" });
}

function logout() {
  authStore.logout();
  goToAuth();
}

onBeforeUnmount(() => {
  walletAnimationCancel?.();
});
</script>

<template>
  <div class="min-h-screen bg-[#04050a] text-white">
    <div class="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-16 pt-8 lg:px-8">
      <header
        class="glass-panel sticky top-4 z-30 flex flex-wrap items-center justify-between gap-4 border border-white/10 px-6 py-4"
      >
        <div class="flex items-center gap-4">
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
          <div v-if="authStore.isAuthenticated" class="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
            <WalletIcon class="h-5 w-5 text-brand-light" />
            <div>
              <p class="text-xs uppercase tracking-[0.4em] text-white/50">Saldo</p>
              <p class="text-lg font-black">{{ walletDisplay }}</p>
            </div>
          </div>
          <BaseButton
            v-if="authStore.isAuthenticated"
            variant="danger"
            size="sm"
            @click="logout"
          >
            <ArrowRightOnRectangleIcon class="h-4 w-4" />
            Sair
          </BaseButton>
          <BaseButton v-else size="sm" @click="goToAuth">Entrar</BaseButton>
        </div>
      </header>

      <section
        class="gap-8"
        :class="{
          'grid xl:grid-cols-[minmax(0,1fr)_320px]': !isAuthRoute,
          'flex w-full justify-center': isAuthRoute,
        }"
      >
        <main :class="['space-y-8', isAuthRoute ? 'w-full max-w-3xl' : '']">
          <slot />
        </main>
        <CartDrawer
          v-if="!isAuthRoute && authStore.isAuthenticated && cartStore.items.length"
          class="hidden xl:flex"
        />
      </section>

      <transition name="fade">
        <div
          v-if="toastMessage"
          class="pointer-events-none fixed top-6 right-6 z-50 flex items-center gap-3 rounded-3xl border px-5 py-3 text-sm font-semibold shadow-card"
          :class="toastClasses"
        >
          {{ toastMessage }}
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