<script setup>
import { onMounted, ref } from "vue";
import UserCard from "../components/UserCard.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import ModalShell from "../components/ui/ModalShell.vue";
import placeholderAvatar from "../assets/placeholder.svg";
import { fetchPublicUsers, fetchPublicProfile } from "../services/userService.js";

const users = ref([]);
const loadingUsers = ref(true);
const usersError = ref(null);

const modalOpen = ref(false);
const modalLoading = ref(false);
const modalError = ref(null);
const selectedUser = ref(null);
const selectedItems = ref([]);
const detailItem = ref(null);

const hasWindow = typeof window !== "undefined";
const dateFormatter = new Intl.DateTimeFormat("pt-BR");

onMounted(loadUsers);

function getDisplayName(user) {
  return (user?.displayName ?? user?.name ?? "").toString();
}

function sortUsers(list = []) {
  return [...list].sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), "pt-BR", { sensitivity: "base" }));
}

async function loadUsers() {
  loadingUsers.value = true;
  usersError.value = null;
  try {
    const data = await fetchPublicUsers({ sort: "displayName:asc" });
    const list = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [];
    users.value = sortUsers(list);
  } catch (error) {
    usersError.value = "Não foi possível carregar os usuários agora.";
  } finally {
    loadingUsers.value = false;
  }
}

async function openInventory(user) {
  selectedUser.value = user;
  selectedItems.value = [];
  modalError.value = null;
  modalOpen.value = true;
  modalLoading.value = true;
  try {
    const data = await fetchPublicProfile(user.id);
    selectedUser.value = data?.user ?? user;
    const inventory = Array.isArray(data?.items) ? data.items : data?.inventory;
    selectedItems.value = Array.isArray(inventory) ? inventory : [];
    if (!selectedItems.value.length) {
      modalError.value = "Este usuário ainda não possui itens públicos.";
    }
  } catch (error) {
    modalError.value = "Não foi possível carregar o inventário.";
  } finally {
    modalLoading.value = false;
  }
}

function closeModal() {
  modalOpen.value = false;
  detailItem.value = null;
}

function formatDate(input) {
  if (!input) {
    return "Data desconhecida";
  }
  try {
    return dateFormatter.format(new Date(input));
  } catch (error) {
    return "Data desconhecida";
  }
}

function resolveItemImage(item) {
  return (
    item?.image_small_icon ??
    item?.image_icon ??
    item?.images?.smallIcon ??
    item?.images?.icon ??
    placeholderAvatar
  );
}

function acquiredLabel(item) {
  return `Adquirido em: ${formatDate(item?.acquired_at ?? item?.acquiredAt)}`;
}

function viewItemDetails(item) {
  detailItem.value = item;
}

function closeDetailView() {
  detailItem.value = null;
}

function openItemMedia(item) {
  const target = item?.wiki_url ?? item?.video;
  if (target && hasWindow) {
    window.open(target, "_blank", "noopener,noreferrer");
  }
}
</script>

<template>
  <section class="space-y-6">
    <header class="glass-panel px-6 py-4">
      <p class="text-xs uppercase tracking-[0.4em] text-white/50">Comunidade</p>
      <h1 class="text-3xl font-black text-white">Usuários da Comunidade</h1>
      <p class="text-sm text-white/60">Consulte o inventário público de cada jogador.</p>
    </header>

    <div v-if="loadingUsers" class="text-white/70">Carregando usuários...</div>
    <p v-else-if="usersError" class="text-rose-300">{{ usersError }}</p>
    <div v-else-if="!users.length" class="text-white/60">Nenhum usuário público encontrado.</div>
    <div v-else class="grid gap-4 md:grid-cols-2">
      <UserCard v-for="user in users" :key="user.id" :user="user">
        <BaseButton size="sm" variant="secondary" @click="openInventory(user)">Inventário</BaseButton>
      </UserCard>
    </div>

    <!-- Pagination removed per request -->

    <ModalShell :open="modalOpen" @close="closeModal">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.4em] text-white/50">Inventário público</p>
          <h3 class="text-2xl font-bold text-white">{{ selectedUser?.displayName ?? selectedUser?.name ?? 'Usuário' }}</h3>
          <p class="text-sm text-white/60">
            {{ selectedUser ? `Registrado em ${formatDate(selectedUser.createdAt ?? selectedUser.created_at)}` : '' }}
          </p>
        </div>
        <BaseButton
          variant="secondary"
          size="sm"
          @click="detailItem ? closeDetailView() : closeModal()"
        >
          {{ "Fechar" }}
        </BaseButton>
      </div>

      <div class="mt-6 space-y-4">
        <p v-if="modalLoading" class="text-white/70">Carregando inventário...</p>
        <p v-else-if="modalError" class="text-rose-300">{{ modalError }}</p>
        <div v-else-if="detailItem" class="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <img :src="resolveItemImage(detailItem)" :alt="detailItem.name" class="h-64 w-full rounded-3xl object-contain bg-black/20 p-4" />
          <div class="space-y-4">
            <header>
              <p class="text-xs uppercase tracking-[0.4em] text-white/50">
                {{ detailItem.rarity_value ?? detailItem.rarity ?? 'raridade' }} ·
                {{ detailItem.type_value ?? detailItem.type ?? 'tipo' }}
              </p>
              <h3 class="text-3xl font-black text-white">{{ detailItem.name }}</h3>
            </header>
            <p class="text-white/70">{{ detailItem.description ?? 'Sem descrição disponível.' }}</p>
            <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              <p>{{ acquiredLabel(detailItem) }}</p>
              <p v-if="detailItem.series">Série: {{ detailItem.series }}</p>
            </div>
          </div>
        </div>
        <div v-else class="grid gap-4 sm:grid-cols-2">
<article
  v-for="item in selectedItems"
  :key="item.cosmetic_id ?? item.id"
  class="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-4 h-full"
>
  <div class="flex-1 flex items-start gap-3">
    <img :src="resolveItemImage(item)" :alt="item.name" class="h-16 w-16 rounded-2xl object-contain bg-black/20 p-2" />

    <div class="flex-1">
      <p class="text-[11px] uppercase tracking-[0.4em] text-white/50">
        {{ item.rarity_value ?? item.rarity ?? 'raridade' }} · {{ item.type_value ?? item.type ?? 'tipo' }}
      </p>

      <h4 class="text-lg font-semibold text-white">{{ item.name }}</h4>

      <p class="text-sm text-white/60 line-clamp-3">
        {{ item.description }}
      </p>
    </div>
  </div>

  <div class="flex items-center justify-between text-sm text-white/70 mt-4">
    <span>{{ acquiredLabel(item) }}</span>
    <BaseButton size="xs" variant="secondary" @click="viewItemDetails(item)">
      Detalhes
    </BaseButton>
  </div>
</article>
        </div>
      </div>
    </ModalShell>
  </section>
</template>