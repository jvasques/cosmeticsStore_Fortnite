<script setup>
import { RouterLink } from "vue-router";
</script>
<template>
  <section class="not-found">
    <div class="not-found__card">
      <p class="not-found__code">404</p>
      <h1>Página não encontrada</h1>
      <p class="not-found__message">
        O endereço acessado não existe ou pode ter sido movido. Use o atalho abaixo para continuar navegando.
      </p>
      <div class="not-found__actions">
        <RouterLink class="primary" :to="{ name: 'showroom' }">
          Voltar ao Showroom
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.not-found {
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.not-found__card {
  max-width: 520px;
  width: 100%;
  background: rgba(17, 17, 26, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2.5rem;
  text-align: center;
  box-shadow: 0 35px 120px rgba(0, 0, 0, 0.35);
}

.not-found__code {
  font-size: 4rem;
  font-weight: 700;
  letter-spacing: 0.2rem;
  margin: 0 0 0.5rem;
  color: #ff4d6d;
}

.not-found__message {
  margin: 1rem 0 2rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

.not-found__actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.not-found__actions .primary,
.not-found__actions .ghost {
  min-width: 180px;
  padding: 0.85rem 1.5rem;
  border-radius: 999px;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.not-found__actions .primary {
  background: linear-gradient(120deg, #ff4d6d, #f72585);
  color: #fff;
  box-shadow: 0 12px 30px rgba(247, 37, 133, 0.35);
}

.not-found__actions .ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
}

.not-found__actions .primary:hover,
.not-found__actions .ghost:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}
</style>