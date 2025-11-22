<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import CosmeticMiniCard from "../components/CosmeticMiniCard.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import ModalShell from "../components/ui/ModalShell.vue";
import BaseBadge from "../components/ui/BaseBadge.vue";
import { useAuthStore } from "../stores/authStore.js";
import { useInventoryStore } from "../stores/inventoryStore.js";
import { sellInventoryItems } from "../services/inventoryService.js";

const amountFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const normalizeKey = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  return null;
};

const coerceNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9+-.]/g, "");
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const collectNestedItems = (transaction) => {
  if (!transaction || typeof transaction !== "object") {
    return [];
  }
  const pools = [
    transaction.items,
    transaction.lineItems,
    transaction.line_items,
    transaction.details?.items,
    transaction.details?.lineItems,
    transaction.details?.line_items,
    transaction.metadata?.items,
    transaction.metadata?.lineItems,
    transaction.metadata?.line_items,
  ];
  return pools.filter(Array.isArray).flat();
};

const gatherTransactionOfferIds = (transaction) => {
  if (!transaction || typeof transaction !== "object") {
    return new Set();
  }
  const offers = new Set();
  const push = (candidate) => {
    const key = normalizeKey(candidate);
    if (key) {
      offers.add(key);
    }
  };

  const directCandidates = [
    transaction.offerId,
    transaction.offer_id,
    transaction.bundleOfferId,
    transaction.bundle_offer_id,
    transaction.order?.offerId,
    transaction.order?.offer_id,
    transaction.metadata?.offerId,
    transaction.metadata?.offer_id,
  ];
  directCandidates.forEach(push);

  collectNestedItems(transaction).forEach((entry) => {
    if (!entry) {
      return;
    }
    push(entry.offerId ?? entry.offer_id ?? entry.bundleOfferId ?? entry.bundle_offer_id);
  });

  return offers;
};

const gatherTransactionCosmeticIds = (transaction) => {
  if (!transaction || typeof transaction !== "object") {
    return new Set();
  }
  const ids = new Set();
  const push = (candidate) => {
    const key = normalizeKey(candidate);
    if (key) {
      ids.add(key);
    }
  };

  const directCandidates = [
    transaction.cosmeticId,
    transaction.cosmetic_id,
    transaction.itemId,
    transaction.item_id,
  ];
  directCandidates.forEach(push);

  collectNestedItems(transaction).forEach((entry) => {
    if (!entry) {
      return;
    }
    push(entry.cosmeticId ?? entry.cosmetic_id ?? entry.itemId ?? entry.item_id);
  });

  return ids;
};

const purchaseKeywords = ["purchase", "buy", "checkout", "debit", "sale"];

const isPurchaseTransaction = (transaction) => {
  if (!transaction || typeof transaction !== "object") {
    return false;
  }
  const typeCandidates = [
    transaction.type,
    transaction.transactionType,
    transaction.transaction_type,
    transaction.kind,
    transaction.direction,
    transaction.category,
  ]
    .map((value) => value?.toString?.().toLowerCase?.())
    .filter(Boolean);

  if (typeCandidates.some((entry) => purchaseKeywords.some((keyword) => entry.includes(keyword)))) {
    return true;
  }

  const amount = coerceNumber(
    transaction.delta ??
      transaction.amount ??
      transaction.value ??
      transaction.total ??
      transaction.price ??
      transaction.finalPrice ??
      transaction.final_price,
  );
  if (typeof amount === "number" && amount < 0) {
    return true;
  }
  return false;
};

const resolveTransactionAmount = (transaction) => {
  if (!transaction || typeof transaction !== "object") {
    return null;
  }
  const amountKeys = [
    "amount",
    "value",
    "delta",
    "change",
    "total",
    "price",
    "finalPrice",
    "final_price",
    "subtotal",
    "vbuckDelta",
    "vbuck_delta",
  ];
  for (const key of amountKeys) {
    const candidate = coerceNumber(transaction[key]);
    if (candidate !== null) {
      return Math.abs(candidate);
    }
  }
  const metadataAmount = coerceNumber(transaction.metadata?.amount ?? transaction.metadata?.value);
  if (metadataAmount !== null) {
    return Math.abs(metadataAmount);
  }
  return null;
};

const resolveTransactionCurrency = (transaction) => {
  if (!transaction || typeof transaction !== "object") {
    return "VB";
  }
  const keys = [
    transaction.currency,
    transaction.walletCurrency,
    transaction.metadata?.currency,
    transaction.metadata?.walletCurrency,
  ];
  return keys.find((value) => typeof value === "string" && value.trim()) ?? "VB";
};

const formatTransactionLabel = (transaction) => {
  if (!transaction || typeof transaction !== "object") {
    return "";
  }
  const type =
    transaction.type ??
    transaction.transactionType ??
    transaction.transaction_type ??
    transaction.kind ??
    "Transação";
  const id = transaction.id ?? transaction.transactionId ?? transaction.transaction_id ?? transaction.reference ?? null;
  const createdAt = transaction.createdAt ?? transaction.created_at ?? transaction.date ?? transaction.timestamp ?? null;
  const stamp = createdAt ? dateTimeFormatter.format(new Date(createdAt)) : null;
  return [type, id, stamp].filter(Boolean).join(" · ");
};

const resolveLineItemAmount = (entry = {}) => {
  const amountKeys = [
    "amount",
    "value",
    "delta",
    "change",
    "total",
    "price",
    "finalPrice",
    "final_price",
    "subtotal",
    "vbuckDelta",
    "vbuck_delta",
  ];
  for (const key of amountKeys) {
    const candidate = coerceNumber(entry[key]);
    if (candidate !== null) {
      return Math.abs(candidate);
    }
  }
  const metaAmount = coerceNumber(entry.metadata?.amount ?? entry.metadata?.value ?? entry.metadata?.total);
  if (metaAmount !== null) {
    return Math.abs(metaAmount);
  }
  return null;
};

const resolveEntryOfferKey = (entry = {}) =>
  normalizeKey(
    entry.offerId ??
      entry.offer_id ??
      entry.bundleOfferId ??
      entry.bundle_offer_id ??
      entry.entryOfferId ??
      entry.entry_offer_id ??
      entry.metadata?.offerId ??
      entry.metadata?.offer_id,
  );

const resolveEntryCosmeticKey = (entry = {}) =>
  normalizeKey(
    entry.cosmeticId ??
      entry.cosmetic_id ??
      entry.itemId ??
      entry.item_id ??
      entry.templateId ??
      entry.template_id ??
      entry.metadata?.cosmeticId ??
      entry.metadata?.cosmetic_id,
  );

const collectMatchingLineItems = (scope, transaction = {}) => {
  if (!scope) {
    return [];
  }
  const entries = collectNestedItems(transaction);
  if (!entries.length) {
    return [];
  }

  const scopeOfferKey = normalizeKey(scope.offerId ?? scope.bundleId);
  const scopeBundleKey = normalizeKey(scope.bundleId);
  const scopeCosmeticKeys = new Set(
    (scope.linkedItems ?? [])
      .map((item) =>
        normalizeKey(
          item.cosmeticId ??
            item.cosmetic_id ??
            item.itemId ??
            item.item_id ??
            item.templateId ??
            item.template_id ??
            item.id,
        ),
      )
      .filter(Boolean),
  );

  return entries.filter((entry) => {
    const entryOfferKey = resolveEntryOfferKey(entry);
    const entryCosmeticKey = resolveEntryCosmeticKey(entry);
    const matchesOffer = scopeOfferKey && entryOfferKey === scopeOfferKey;
    const matchesBundle = scopeBundleKey && entryOfferKey === scopeBundleKey;
    const matchesCosmetic = entryCosmeticKey && scopeCosmeticKeys.has(entryCosmeticKey);
    return matchesOffer || matchesBundle || matchesCosmetic;
  });
};

const resolveSellAmount = (scope, transaction) => {
  if (!transaction) {
    return null;
  }
  const matchingEntries = collectMatchingLineItems(scope, transaction);
  if (matchingEntries.length) {
    const total = matchingEntries.reduce((sum, entry) => {
      const amount = resolveLineItemAmount(entry);
      return sum + (amount ?? 0);
    }, 0);
    if (total > 0) {
      return total;
    }
  }
  return resolveTransactionAmount(transaction);
};

const findRelatedTransaction = (scope, transactions = []) => {
  if (!scope || !transactions.length) {
    return null;
  }
  const offerKey = normalizeKey(scope.offerId ?? scope.bundleId);
  const bundleKey = normalizeKey(scope.bundleId);
  const cosmeticKeys = new Set(
    (scope.linkedItems ?? [])
      .map((item) =>
        normalizeKey(
          item.cosmeticId ??
            item.cosmetic_id ??
            item.itemId ??
            item.item_id ??
            item.templateId ??
            item.template_id ??
            item.id,
        ),
      )
      .filter(Boolean),
  );

  let fallback = null;
  for (const transaction of transactions) {
    if (!isPurchaseTransaction(transaction)) {
      continue;
    }
    const offerMatches = gatherTransactionOfferIds(transaction);
    const cosmeticMatches = gatherTransactionCosmeticIds(transaction);
    if (offerKey && offerMatches.has(offerKey)) {
      return transaction;
    }
    if (bundleKey && offerMatches.has(bundleKey)) {
      fallback = fallback ?? transaction;
    }
    if (cosmeticKeys.size) {
      for (const key of cosmeticKeys) {
        if (cosmeticMatches.has(key)) {
          return transaction;
        }
      }
    }
  }
  return fallback;
};

const formatAmount = (amount, currency = "VB") => {
  if (amount === null || amount === undefined) {
    return null;
  }
  return `${amountFormatter.format(amount)} ${currency}`;
};

const buildSellPayload = (scope, transaction, amount, currency) => {
  const cosmeticIds = (scope.linkedItems ?? [])
    .map((item) => item.cosmeticId ?? item.cosmetic_id ?? item.itemId ?? item.item_id ?? item.templateId ?? item.template_id)
    .filter(Boolean);
  const inventoryIds = (scope.linkedItems ?? [])
    .map((item) => item.inventoryId ?? item.inventory_id ?? item.userCosmeticId ?? item.user_cosmetic_id ?? item.id)
    .filter(Boolean);
  const matchingEntries = collectMatchingLineItems(scope, transaction);

  return {
    offerId: scope.offerId ?? undefined,
    bundleId: scope.bundleId ?? undefined,
    cosmeticIds,
    inventoryIds,
    items: (scope.linkedItems ?? []).map((item) => ({
      inventoryId: item.inventoryId ?? item.inventory_id ?? item.id ?? null,
      cosmeticId: item.cosmeticId ?? item.cosmetic_id ?? null,
      name: item.name ?? null,
    })),
    metadata: {
      source: "frontend",
      mode: scope.isBundle ? "bundle" : "single",
      lineItems: matchingEntries.map((entry) => ({
        offerId: resolveEntryOfferKey(entry),
        cosmeticId: resolveEntryCosmeticKey(entry),
        amount: resolveLineItemAmount(entry),
        name: entry.name ?? entry.title ?? null,
      })),
    },
    transactionId: transaction?.id ?? transaction?.transactionId ?? transaction?.transaction_id,
    amountPaid: amount ?? undefined,
    currency,
  };
};

const resolveSellErrorMessage = (error) => {
  const data = error?.response?.data;
  if (data) {
    const message =
      data.message ??
      data.error ??
      data.detail ??
      data.description ??
      data.title ??
      null;
    if (message) {
      return message;
    }
  }
  return error?.message ?? "Não foi possível concluir a venda.";
};

const router = useRouter();
const authStore = useAuthStore();
const inventoryStore = useInventoryStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
const itensCount = computed(() => inventoryStore.items.length);
const inspectItem = ref(null);
const sellTarget = ref(null);
const sellState = reactive({
  processing: false,
  refreshingWallet: false,
  error: null,
  success: null,
});
const walletTransactions = computed(() => authStore.wallet?.transactions ?? []);
const sellScope = computed(() => (sellTarget.value ? inventoryStore.buildSellScope(sellTarget.value) : null));
const sellLinkedItems = computed(() => sellScope.value?.linkedItems ?? []);
const sellTransaction = computed(() =>
  sellScope.value ? findRelatedTransaction(sellScope.value, walletTransactions.value) : null,
);
const sellAmountValue = computed(() => resolveSellAmount(sellScope.value, sellTransaction.value));
const sellCurrency = computed(() => resolveTransactionCurrency(sellTransaction.value));
const sellAmountLabel = computed(() => formatAmount(sellAmountValue.value, sellCurrency.value));
const sellModalTitle = computed(() => (sellScope.value?.isBundle ? "Vender bundle" : "Vender item"));
const sellModalDescription = computed(() =>
  sellScope.value?.isBundle
    ? "Todos os itens vinculados serão removidos do seu inventário."
    : "O item será removido e o backend creditará a venda na sua carteira.",
);

const resetSellState = () => {
  sellState.error = null;
  sellState.success = null;
  sellState.processing = false;
  sellState.refreshingWallet = false;
};

const resolveKey = (item) => {
  if (item?.id || item?.inventory_id || item?.cosmetic_id || item?.cosmeticId) {
    return item.id ?? item.inventory_id ?? item.cosmetic_id ?? item.cosmeticId;
  }
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

async function loadInventory() {
  if (!isAuthenticated.value) {
    return;
  }
  await inventoryStore.load({ silent: false, force: true });
}

const resolveItemImage = (item) =>
  item?.image_icon ??
  item?.image_feature ??
  item?.image_small_icon ??
  item?.images?.icon ??
  item?.images?.featured ??
  item?.images?.smallIcon ??
  null;

const resolveRarity = (item) => item?.rarity_value ?? item?.rarity ?? "common";
const resolveType = (item) => item?.type_value ?? item?.type ?? "item";
const resolveDescription = (item) =>
  item?.description ??
  item?.summary ??
  item?.details ??
  item?.metadata?.description ??
  "Sem descrição disponível.";

function openDetails(item) {
  inspectItem.value = item;
}

function closeDetails() {
  inspectItem.value = null;
}

async function openSellModal(item) {
  sellTarget.value = item;
  resetSellState();
  if (!walletTransactions.value.length && authStore.refreshWallet) {
    sellState.refreshingWallet = true;
    try {
      await authStore.refreshWallet();
    } catch (error) {
      console.warn("Falha ao atualizar carteira.", error);
    } finally {
      sellState.refreshingWallet = false;
    }
  }
}

function closeSellModal() {
  sellTarget.value = null;
  resetSellState();
}

async function confirmSell() {
  if (!sellScope.value || sellState.processing) {
    return;
  }
  const payload = buildSellPayload(
    sellScope.value,
    sellTransaction.value,
    sellAmountValue.value,
    sellCurrency.value,
  );
  if (!payload.cosmeticIds.length && !payload.inventoryIds.length) {
    sellState.error = "Não conseguimos identificar o item no inventário.";
    return;
  }
  sellState.processing = true;
  sellState.error = null;
  sellState.success = null;
  try {
    const response = await sellInventoryItems(payload);
    sellState.success = response?.message ?? "Venda registrada com sucesso.";
    const removedIds =
      response?.removedInventoryIds ??
      response?.removed_inventory_ids ??
      response?.inventoryIds ??
      response?.inventory_ids ??
      [];
    if (Array.isArray(removedIds) && removedIds.length) {
      inventoryStore.removeEntriesByIds(removedIds);
    } else {
      inventoryStore.load({ silent: true, force: true }).catch(() => {});
    }
    if (authStore?.refreshWallet) {
      authStore.refreshWallet().catch(() => {});
    }
    setTimeout(() => {
      closeSellModal();
    }, 1200);
  } catch (error) {
    sellState.error = resolveSellErrorMessage(error);
  } finally {
    sellState.processing = false;
  }
}

onMounted(() => {
  if (isAuthenticated.value && !inventoryStore.initialized) {
    inventoryStore.load({ silent: true });
  }
});
</script>

<template>
  <section class="space-y-6">
    <header class="glass-panel px-6 py-4">
      <p class="text-xs uppercase tracking-[0.4em] text-white/50">Inventário</p>
      <h1 class="text-3xl font-black text-white">Seus itens</h1>
      <p class="text-sm text-white/60"> {{ itensCount }} itens adquiridos.</p>
    </header>

    <div v-if="!isAuthenticated" class="glass-panel space-y-4 px-6 py-8 text-center">
      <p class="text-white/80">Entre para sincronizar seu inventário com o banco de dados.</p>
      <BaseButton @click="router.push({ name: 'auth' })">Fazer login</BaseButton>
    </div>

    <div v-else>
      <div v-if="inventoryStore.loading" class="glass-panel px-6 py-8 text-center text-white/70">Carregando inventário...</div>
      <div v-else-if="inventoryStore.error" class="glass-panel space-y-4 px-6 py-8 text-center">
        <p class="text-white">Não foi possível carregar seu inventário.</p>
        <BaseButton variant="secondary" @click="loadInventory">Tentar novamente</BaseButton>
      </div>
      <div v-else-if="!inventoryStore.items.length" class="glass-panel px-6 py-8 text-center text-white/70">
        Nenhum item no inventário ainda.
      </div>
      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CosmeticMiniCard
          v-for="item in inventoryStore.items"
          :key="resolveKey(item)"
          :item="item"
          show-details
          show-sell
          :disable-sell="sellState.processing"
          @details="openDetails"
          @sell="openSellModal"
        />
      </div>
    </div>

    <ModalShell :open="Boolean(inspectItem)" @close="closeDetails">
      <template v-if="inspectItem">
        <div class="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <img
            :src="resolveItemImage(inspectItem)"
            :alt="inspectItem.name"
            class="h-80 w-full rounded-3xl object-cover"
          />
          <div class="space-y-4">
            <div class="flex flex-wrap gap-2">
              <BaseBadge v-if="inspectItem.is_new || inspectItem.isNew" variant="success">Novo</BaseBadge>
              <BaseBadge v-if="(inspectItem.metadata?.originType ?? inspectItem.origin) === 'bundle'" variant="warning">
                Bundle
              </BaseBadge>
            </div>
            <header>
              <p class="text-xs uppercase tracking-[0.4em] text-white/50">
                {{ resolveRarity(inspectItem) }} · {{ resolveType(inspectItem) }}
              </p>
              <h2 class="text-3xl font-black text-white">{{ inspectItem.name }}</h2>
            </header>
            <p class="text-white/70">
              {{ resolveDescription(inspectItem) }}
            </p>
            <div class="flex flex-wrap justify-end gap-3">
              <BaseButton variant="secondary" @click="closeDetails">Fechar</BaseButton>
            </div>
          </div>
        </div>
      </template>
    </ModalShell>

    <ModalShell :open="Boolean(sellTarget)" @close="closeSellModal">
      <template v-if="sellScope">
        <div class="space-y-6">
          <header>
            <p class="text-xs uppercase tracking-[0.4em] text-white/50">{{ sellModalTitle }}</p>
            <h2 class="text-3xl font-black text-white">{{ sellScope.target?.name ?? "Cosmético" }}</h2>
            <p class="text-sm text-white/70">{{ sellModalDescription }}</p>
          </header>

          <div class="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
            <p class="text-xs uppercase tracking-[0.4em] text-white/50">Itens afetados</p>
            <ul class="space-y-1 text-sm text-white/80">
              <li v-for="linked in sellLinkedItems" :key="resolveKey(linked)">
                {{ linked.name ?? linked.cosmeticId ?? "Cosmético" }}
              </li>
            </ul>
            <p v-if="sellScope.isBundle" class="text-base text-white-300/80 bg-red-600 p-2 rounded-lg mt-2 text-center">
              ⚠️ ATENÇÃO: Este item veio de um bundle. A venda afetará todos os itens listados acima.
            </p>
          </div>

          <div class="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-4">
            <p class="text-xs uppercase tracking-[0.4em] text-white/50">Resumo financeiro</p>
            <p v-if="sellAmountLabel" class="text-lg font-semibold text-white">Pagou {{ sellAmountLabel }}</p>
            <p v-else class="text-sm text-white/70">
              Não encontramos a transação original. Prosseguir com a venda solicitará validação do backend.
            </p>
            <p v-if="sellTransaction" class="text-xs text-white/50">{{ formatTransactionLabel(sellTransaction) }}</p>
          </div>

          <p v-if="sellState.error" class="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {{ sellState.error }}
          </p>
          <p v-if="sellState.success" class="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {{ sellState.success }}
          </p>
          <p v-if="sellState.refreshingWallet" class="text-xs text-white/60">Carregando transações recentes...</p>

          <div class="flex flex-wrap justify-end gap-3">
            <BaseButton variant="secondary" :disabled="sellState.processing" @click="closeSellModal">Cancelar</BaseButton>
            <BaseButton :disabled="sellState.processing" @click="confirmSell">
              <span v-if="sellState.processing">Processando...</span>
              <span v-else>Confirmar venda</span>
            </BaseButton>
          </div>
        </div>
      </template>
    </ModalShell>
  </section>
</template>