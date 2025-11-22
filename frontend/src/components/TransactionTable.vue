<script setup>
const props = defineProps({
  transactions: {
    type: Array,
    default: () => [],
  },
});

const typeLabels = {
  credit: "Crédito",
  debit: "Débito",
};

const actionLabelMap = {
  purchase: "Compra",
  buy: "Compra",
  acquisition: "Compra",
  checkout: "Compra",
  sale: "Venda",
  sell: "Venda",
  resale: "Venda",
  refund: "Devolução",
  return: "Devolução",
  reimbursement: "Devolução",
};

const normalizeText = (value) => {
  if (!value && value !== 0) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (Array.isArray(value)) {
    const list = value.map((entry) => normalizeText(entry)).filter(Boolean);
    return list.length ? list.join(", ") : null;
  }
  if (typeof value === "object") {
    return (
      normalizeText(value?.id ?? value?.value ?? value?.itemId ?? value?.bundleId ?? value?.cosmeticId ?? value?.key) ??
      null
    );
  }
  return null;
};

const pickFirst = (...candidates) => {
  for (const candidate of candidates) {
    const value = typeof candidate === "function" ? candidate() : candidate;
    const normalized = normalizeText(value);
    if (normalized) {
      return normalized;
    }
  }
  return null;
};

const extractFromCollection = (collection, keyCandidates = [], predicate = () => true) => {
  if (!Array.isArray(collection)) {
    return null;
  }
  for (const entry of collection) {
    if (!predicate(entry)) {
      continue;
    }
    for (const key of keyCandidates) {
      const value = normalizeText(entry?.[key]);
      if (value) {
        return value;
      }
    }
    if (entry?.metadata) {
      for (const key of keyCandidates) {
        const value = normalizeText(entry.metadata?.[key]);
        if (value) {
          return value;
        }
      }
    }
  }
  return null;
};

const extractActionKey = (tx = {}) => {
  const rawCandidates = [
    tx.action,
    tx.event,
    tx.operation,
    tx.kind,
    tx.category,
    tx.intent,
    tx.metadata?.action,
    tx.metadata?.event,
    tx.metadata?.operation,
    tx.metadata?.type,
    tx.metadata?.intent,
    tx.metadata?.transactionType,
    tx.metadata?.transaction_type,
  ];

  for (const raw of rawCandidates) {
    const normalized = normalizeText(raw);
    if (!normalized) {
      continue;
    }
    const lower = normalized.toLowerCase();
    if (lower.includes("purchase") || lower.includes("buy") || lower.includes("acquisition") || lower.includes("checkout")) {
      return "purchase";
    }
    if (lower.includes("refund") || lower.includes("return") || lower.includes("reimb")) {
      return "refund";
    }
    if (lower.includes("sale") || lower.includes("sell")) {
      return "sale";
    }
  }
  return null;
};

const extractBundleId = (tx = {}) =>
  pickFirst(
    tx.bundleId,
    tx.bundle_id,
    tx.bundleOfferId,
    tx.bundle_offer_id,
    tx.bundleEntryId,
    tx.bundle_entry_id,
    tx.bundlePurchaseId,
    tx.bundle_purchase_id,
    tx.transaction?.bundleId,
    tx.transaction?.bundle_id,
    tx.details?.bundleId,
    tx.details?.bundle_id,
    tx.details?.bundle?.id,
    tx.metadata?.bundleId,
    tx.metadata?.bundle_id,
    tx.metadata?.bundleOfferId,
    tx.metadata?.bundle_offer_id,
    tx.metadata?.bundleEntryId,
    tx.metadata?.bundle_entry_id,
    tx.metadata?.targetBundleId,
    tx.metadata?.target_bundle_id,
    tx.metadata?.transaction?.bundleId,
    tx.metadata?.transaction?.bundle_id,
    tx.metadata?.bundle?.id,
    tx.metadata?.bundle?.bundleId,
    tx.metadata?.bundle?.bundle_id,
    tx.metadata?.bundleInfo?.id,
    tx.metadata?.bundleInfo?.bundleId,
    tx.metadata?.bundleInfo?.bundle_id,
    tx.bundle?.id,
    tx.bundle?.bundleId,
    tx.bundle?.bundle_id,
    () => extractFromCollection(
      tx.items,
      ["bundleId", "bundle_id", "id", "offerId", "offer_id"],
      (entry) => (entry?.type ?? entry?.kind ?? "").toLowerCase().includes("bundle"),
    ),
    () => extractFromCollection(
      tx.metadata?.items,
      ["bundleId", "bundle_id", "id", "offerId", "offer_id"],
      (entry) => (entry?.type ?? entry?.kind ?? "").toLowerCase().includes("bundle"),
    ),
  );

const extractItemId = (tx = {}) =>
  pickFirst(
    tx.itemId,
    tx.item_id,
    tx.cosmeticId,
    tx.cosmetic_id,
    tx.entryItemId,
    tx.entry_item_id,
    tx.targetItemId,
    tx.target_item_id,
    tx.targetId,
    tx.target_id,
    tx.entryId,
    tx.entry_id,
    tx.transaction?.itemId,
    tx.transaction?.item_id,
    tx.transaction?.targetId,
    tx.transaction?.target_id,
    tx.details?.itemId,
    tx.details?.item_id,
    tx.details?.item?.id,
    tx.metadata?.itemId,
    tx.metadata?.item_id,
    tx.metadata?.cosmeticId,
    tx.metadata?.cosmetic_id,
    tx.metadata?.targetItemId,
    tx.metadata?.target_item_id,
    tx.metadata?.targetId,
    tx.metadata?.target_id,
    tx.metadata?.entryId,
    tx.metadata?.entry_id,
    tx.metadata?.transaction?.itemId,
    tx.metadata?.transaction?.item_id,
    tx.metadata?.transaction?.targetId,
    tx.metadata?.transaction?.target_id,
    tx.item?.id,
    tx.item?.itemId,
    tx.item?.item_id,
    tx.metadata?.item?.id,
    tx.metadata?.item?.itemId,
    tx.metadata?.item?.item_id,
    () => extractFromCollection(
      tx.items,
      ["itemId", "item_id", "cosmeticId", "cosmetic_id", "id", "offerId", "offer_id"],
      (entry) => !(entry?.type ?? entry?.kind ?? "").toLowerCase().includes("bundle"),
    ),
    () => extractFromCollection(
      tx.metadata?.items,
      ["itemId", "item_id", "cosmeticId", "cosmetic_id", "id", "offerId", "offer_id"],
      (entry) => !(entry?.type ?? entry?.kind ?? "").toLowerCase().includes("bundle"),
    ),
  );

const detectEntityKind = (tx = {}) => {
  const metadataKind = normalizeText(
    tx.entityType ??
      tx.entity_type ??
      tx.resourceType ??
      tx.resource_type ??
      tx.targetType ??
      tx.target_type ??
      tx.metadata?.entityType ??
      tx.metadata?.entity_type ??
      tx.metadata?.resourceType ??
      tx.metadata?.resource_type ??
      tx.metadata?.targetType ??
      tx.metadata?.target_type,
  );
  if (metadataKind) {
    const lower = metadataKind.toLowerCase();
    if (lower.includes("bundle")) {
      return "bundle";
    }
    if (lower.includes("item") || lower.includes("cosmetic")) {
      return "item";
    }
  }

  const bundleId = extractBundleId(tx);
  if (bundleId) {
    return "bundle";
  }

  const itemId = extractItemId(tx);
  if (itemId) {
    return "item";
  }

  return null;
};

const resolveEntityId = (tx = {}) => {
  const kind = detectEntityKind(tx);
  if (kind === "bundle") {
    return extractBundleId(tx) ?? extractItemId(tx);
  }
  return extractItemId(tx) ?? extractBundleId(tx);
};

const resolveActionLabel = (tx = {}) => {
  const key = extractActionKey(tx);
  if (key) {
    return actionLabelMap[key];
  }
  const typeKey = normalizeText(tx.type);
  if (typeKey && actionLabelMap[typeKey.toLowerCase()]) {
    return actionLabelMap[typeKey.toLowerCase()];
  }
  const transactionType = normalizeText(tx.transaction_type ?? tx.kind);
  if (transactionType && actionLabelMap[transactionType.toLowerCase()]) {
    return actionLabelMap[transactionType.toLowerCase()];
  }
  if (normalizeText(tx.type)?.toLowerCase() === "debit" || (resolveAmount(tx) ?? 0) < 0) {
    return actionLabelMap.purchase;
  }
  if (normalizeText(tx.type)?.toLowerCase() === "credit" || (resolveAmount(tx) ?? 0) > 0) {
    return actionLabelMap.sale;
  }
  return null;
};

const resolveDescription = (tx = {}) => {
  const apiDescription = resolveApiDescription(tx);
  if (apiDescription) {
    return apiDescription;
  }
  const action = resolveActionLabel(tx);
  const entityKind = detectEntityKind(tx);
  const entityId = resolveEntityId(tx);

  if (!action && !entityKind && !entityId && tx.description) {
    return tx.description;
  }

  const kindLabel = entityKind === "bundle" ? "bundle" : "item";
  const idLabel = entityId ? `id "${entityId}"` : "id desconhecido";
  return `${action ?? "Operação"} ${kindLabel} ${idLabel}`.trim();
};

const resolveDate = (tx) => {
  const raw = tx.created_at ?? tx.createdAt ?? tx.date;
  if (!raw) {
    return "—";
  }
  try {
    return new Date(raw).toLocaleString("pt-BR");
  } catch {
    return raw;
  }
};

const resolveAmount = (tx) => Number(tx.amount ?? tx.value ?? 0);

const formatAmount = (tx) => resolveAmount(tx).toLocaleString("pt-BR") + " VB";
const formatAbsoluteAmount = (tx) => Math.abs(resolveAmount(tx)).toLocaleString("pt-BR") + " VB";

const resolveApiDescription = (tx = {}) =>
  pickFirst(
    tx.description,
    tx.details?.description,
    tx.metadata?.description,
    tx.metadata?.details?.description,
  );
</script>

<template>
  <div class="glass-panel overflow-hidden">
    <table class="min-w-full divide-y divide-white/5 text-xs">
      <thead class="bg-white/5 text-[11px]">
        <tr>
          <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.35em] text-white/60">
            Data
          </th>
          <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.35em] text-white/60">
            Tipo
          </th>
          <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.35em] text-white/60">
            Descrição
          </th>
          <th class="px-3 py-2 text-right font-semibold uppercase tracking-[0.35em] text-white/60">
            Valor
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5 text-[13px]">
        <tr v-if="!props.transactions.length">
          <td colspan="5" class="px-6 py-8 text-center text-white/60">
            Sem movimentações ainda.
          </td>
        </tr>
        <tr v-for="tx in props.transactions" :key="tx.id ?? tx.transaction_id" class="hover:bg-white/5">
          <td class="px-3 py-2 text-white/70">{{ resolveDate(tx) }}</td>
          <td class="px-3 py-2">
            <span
              :class="[
                'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                (tx.type ?? '').includes('credit')
                  ? 'bg-accent-success/20 text-accent-success'
                  : 'bg-rose-500/10 text-rose-200',
              ]"
            >
              {{ typeLabels[tx.type] ?? tx.type }}
            </span>
          </td>
          <td class="px-3 py-2 text-white/80">{{ resolveDescription(tx) }}</td>
          <td
            class="px-3 py-2 text-right font-semibold"
            :class="resolveAmount(tx) >= 0 ? 'text-accent-success' : 'text-rose-300'"
          >
            {{ resolveAmount(tx) >= 0 ? '+' : '' }}{{ formatAmount(tx) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>