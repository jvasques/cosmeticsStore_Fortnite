<script setup>
import UserCard from "../components/UserCard.vue";
import { mockUsers } from "../mock/catalog.js";
</script>

<template>
  <section class="space-y-6">
    <header class="glass-panel px-6 py-4">
      <p class="text-xs uppercase tracking-[0.4em] text-white/50">Diretório</p>
      <h1 class="text-3xl font-black text-white">Comunidade</h1>
      <p class="text-sm text-white/60">Aguardando endpoints `/users` e `/users/:id`.</p>
    </header>

    <div class="grid gap-4 md:grid-cols-2">
      <UserCard v-for="user in mockUsers" :key="user.id" :user="user" />
    </div>
  </section>
</template>