<script setup>
import { RouterLink } from "vue-router";
</script>

<template>
  <section class="flex items-center justify-center p-8">
    <div
      class="max-w-lg w-full bg-[#11111A]/90 border border-white/10 rounded-2xl p-10 text-center shadow-[0_35px_120px_rgba(0,0,0,0.35)]"
    >
      <p class="text-6xl font-bold tracking-widest text-[#ff4d6d]">404</p>

      <h1 class="mt-2 text-2xl font-semibold">Página não encontrada</h1>

      <p class="mt-4 mb-8 text-white/70 leading-relaxed">
        O endereço acessado não existe ou pode ter sido movido. Use o atalho abaixo
        para continuar navegando.
      </p>

      <div class="flex justify-center gap-4 flex-wrap">
        <RouterLink
          :to="{ name: 'showroom' }"
          class="min-w-[180px] px-6 py-3 rounded-full font-semibold text-center text-white cursor-pointer transition-transform duration-200 shadow-[0_12px_30px_rgba(247,37,133,0.35)] bg-gradient-to-r from-[#ff4d6d] to-[#f72585] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
        >
          Voltar ao Showroom
        </RouterLink>
      </div>
    </div>
  </section>
</template>