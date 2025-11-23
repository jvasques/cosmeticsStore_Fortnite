<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import BaseButton from "../components/ui/BaseButton.vue";
import { useAuthStore } from "../stores/authStore.js";

const authStore = useAuthStore();
const router = useRouter();
const mode = ref("login");
const form = ref({ email: "", password: "", displayName: "" });
const fieldErrors = ref({});
const submitError = ref("");

function resetFeedback() {
  fieldErrors.value = {};
  submitError.value = "";
}

function validate() {
  const errors = {};
  const email = form.value.email.trim();
  if (!email) {
    errors.email = "Informe seu e-mail";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "E-mail inválido";
  }

  const password = form.value.password;
  if (!password) {
    errors.password = "Informe sua senha";
  } else if (password.length < 6) {
    errors.password = "A senha precisa ter pelo menos 6 caracteres";
  }

  if (mode.value === "register") {
    const displayName = form.value.displayName.trim();
    if (!displayName) {
      errors.displayName = "Informe um nome de exibição";
    } else if (displayName.length < 3) {
      errors.displayName = "Use pelo menos 3 caracteres";
    }
  }

  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
}

function extractErrorMessage(err) {
  if (!err) {
    return "Não foi possível concluir a solicitação.";
  }
  const status = err.response?.status;
  if (status === 401) {
    return "Credenciais inválidas. Verifique seus dados e tente novamente.";
  }
  if (status === 409) {
    return "E-mail já está cadastrado.";
  }
  if (err.response?.data) {
    const data = err.response.data;
    if (typeof data === "string") {
      return data;
    }
    if (data.message) {
      return data.message;
    }
    if (Array.isArray(data.errors) && data.errors.length) {
      return data.errors[0];
    }
  }
  if (err.message) {
    return err.message;
  }
  return "Algo deu errado. Tente novamente.";
}

function toggleMode() {
  mode.value = mode.value === "login" ? "register" : "login";
  resetFeedback();
}

async function submit() {
  submitError.value = "";
  if (!validate()) {
    return;
  }
  if (mode.value === "login") {
    try {
      await authStore.login({ email: form.value.email, password: form.value.password });
    } catch (err) {
      submitError.value = extractErrorMessage(err);
      return;
    }
  } else {
    try {
      await authStore.register({
        email: form.value.email,
        password: form.value.password,
        displayName: form.value.displayName,
      });
    } catch (err) {
      submitError.value = extractErrorMessage(err);
      return;
    }
  }
  router.replace({ name: "showroom" });
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-240px)] w-full items-center justify-center py-8">
    <section class="glass-panel w-full max-w-md space-y-6 px-6 py-8">
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
          :class="[
            'w-full rounded-2xl border bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none',
            fieldErrors.email ? 'border-rose-400/70 focus:border-rose-400' : 'border-white/10 focus:border-brand',
          ]"
          :aria-invalid="Boolean(fieldErrors.email)"
          placeholder="player@example.com"
        />
        <p v-if="fieldErrors.email" class="text-xs text-rose-300">{{ fieldErrors.email }}</p>
      </label>
      <label class="block space-y-1">
        <span class="text-sm font-semibold text-white/80">Senha</span>
        <input
          v-model="form.password"
          type="password"
          minlength="6"
          required
          :class="[
            'w-full rounded-2xl border bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none',
            fieldErrors.password ? 'border-rose-400/70 focus:border-rose-400' : 'border-white/10 focus:border-brand',
          ]"
          :aria-invalid="Boolean(fieldErrors.password)"
          placeholder="********"
        />
        <p v-if="fieldErrors.password" class="text-xs text-rose-300">{{ fieldErrors.password }}</p>
      </label>
      <label v-if="mode === 'register'" class="block space-y-1">
        <span class="text-sm font-semibold text-white/80">Nome de exibição</span>
        <input
          v-model="form.displayName"
          type="text"
          required
          minlength="3"
          :class="[
            'w-full rounded-2xl border bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none',
            fieldErrors.displayName ? 'border-rose-400/70 focus:border-rose-400' : 'border-white/10 focus:border-brand',
          ]"
          :aria-invalid="Boolean(fieldErrors.displayName)"
          placeholder="ex: Pro Player"
        />
        <p v-if="fieldErrors.displayName" class="text-xs text-rose-300">{{ fieldErrors.displayName }}</p>
      </label>
      <div v-if="submitError" class="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
        {{ submitError }}
      </div>
      <BaseButton :loading="authStore.loading" class="w-full">{{ mode === 'login' ? 'Entrar' : 'Registrar' }}</BaseButton>
    </form>

      <p class="text-center text-sm text-white/60">
        {{ mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?' }}
      <button class="font-semibold text-brand-light" type="button" @click="toggleMode">
          {{ mode === 'login' ? 'Criar agora' : 'Entrar' }}
        </button>
      </p>
    </section>
  </div>
</template>