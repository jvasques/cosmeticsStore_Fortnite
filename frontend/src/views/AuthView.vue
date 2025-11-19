<script setup>
import { ref } from "vue";
import BaseButton from "../components/ui/BaseButton.vue";
import { useAuthStore } from "../stores/authStore.js";

const authStore = useAuthStore();
const mode = ref("login");
const form = ref({ email: "", password: "" });

async function submit() {
  if (mode.value === "login") {
    await authStore.login(form.value);
  } else {
    await authStore.register(form.value);
  }
}
</script>

<template>
  <section class="glass-panel mx-auto max-w-md space-y-6 px-6 py-8">
    <header class="space-y-2 text-center">
      <p class="text-xs uppercase tracking-[0.4em] text-white/50">{{ mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta' }}</p>
      <h1 class="text-3xl font-black text-white">{{ mode === 'login' ? 'Entrar' : 'Registrar' }}</h1>
      <p class="text-sm text-white/60">Saldo inicial de 10.000 V-Bucks no primeiro login.</p>
    </header>

    <form class="space-y-4" @submit.prevent="submit">
      <label class="block space-y-1">
        <span class="text-sm font-semibold text-white/80">E-mail</span>
        <input
          v-model="form.email"
          type="email"
          required
          class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-brand focus:outline-none"
          placeholder="player@example.com"
        />
      </label>
      <label class="block space-y-1">
        <span class="text-sm font-semibold text-white/80">Senha</span>
        <input
          v-model="form.password"
          type="password"
          minlength="6"
          required
          class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-brand focus:outline-none"
          placeholder="********"
        />
      </label>
      <BaseButton :loading="authStore.loading" class="w-full">Continuar</BaseButton>
    </form>

    <p class="text-center text-sm text-white/60">
      {{ mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?' }}
      <button class="font-semibold text-brand-light" type="button" @click="mode = mode === 'login' ? 'register' : 'login'">
        {{ mode === 'login' ? 'Criar agora' : 'Entrar' }}
      </button>
    </p>
  </section>
</template>