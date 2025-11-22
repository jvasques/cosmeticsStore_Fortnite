import { defineStore } from "pinia";
import { ref } from "vue";
import { purchaseItems } from "../services/storeService.js";
import { useAuthStore } from "./authStore.js";
import { useInventoryStore } from "./inventoryStore.js";

export const useCartStore = defineStore("cart", () => {
  const items = ref([]);
  const toast = ref(null);
  const processing = ref(false);
  const lastOrder = ref(null);
  const checkoutError = ref(null);
  const authStore = useAuthStore();
  const inventoryStore = useInventoryStore();

  const normalizeKey = (candidate) => {
    if (candidate === null || candidate === undefined) {
      return null;
    }
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      return trimmed || null;
    }
    if (typeof candidate === "number") {
      return Number.isFinite(candidate) ? String(candidate) : null;
    }
    return null;
  };

  function resolveEntryKey(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }
    return (
      normalizeKey(entry.offerId) ??
      normalizeKey(entry.offer_id) ??
      normalizeKey(entry.id) ??
      normalizeKey(entry.cosmeticId) ??
      normalizeKey(entry.cosmetic_id) ??
      normalizeKey(entry.bundleId) ??
      normalizeKey(entry.bundle_id) ??
      null
    );
  }

  function resolveKeyFromAny(entryOrKey) {
    if (typeof entryOrKey === "string" || typeof entryOrKey === "number") {
      return normalizeKey(entryOrKey);
    }
    return resolveEntryKey(entryOrKey);
  }

  function has(entryOrKey) {
    const key = resolveKeyFromAny(entryOrKey);
    if (!key) {
      return false;
    }
    return items.value.some((existing) => resolveEntryKey(existing) === key);
  }

  function showToast(message, type = "success", duration = 2500) {
    toast.value = { message, type };
    if (duration) {
      setTimeout(() => {
        if (toast.value?.message === message) {
          toast.value = null;
        }
      }, duration);
    }
  }

  function add(item) {
    const key = resolveEntryKey(item);
    if (!key) {
      showToast("Não conseguimos identificar este item.", "error", 2500);
      return;
    }
    if (has(key)) {
      showToast("Item já está no carrinho", "error", 2500);
      return;
    }
    if (inventoryStore.ownsCartEntry(item)) {
      showToast("Você já possui este item ou bundle", "error", 2500);
      return;
    }
    items.value.push(item);
    showToast(`Item adicionado`, "success", 2000);
  }

  function remove(entryOrKey) {
    const key = resolveKeyFromAny(entryOrKey);
    if (!key) {
      return;
    }
    items.value = items.value.filter((item) => resolveEntryKey(item) !== key);
    showToast("Item removido", "error", 2000);
  }

  function clear(options = {}) {
    items.value = [];
    if (!options.silent) {
      showToast("Carrinho esvaziado", "error", 2000);
    }
  }

  function normalizePrice(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function buildCheckoutItems(entries = []) {
    return entries.map((entry) => {
      const quantity = Number(entry.quantity ?? 1) || 1;
      const finalPrice = normalizePrice(
        entry.finalPrice ?? entry.final_price ?? entry.regular_price ?? entry.regularPrice,
      );
      return {
        id: entry.id ?? null,
        offerId: entry.offerId ?? entry.offer_id ?? null,
        name: entry.name ?? entry.bundleName ?? "Cosmético",
        type: entry.type ?? (entry.bundleName ? "bundle" : "item"),
        quantity,
        finalPrice,
      };
    });
  }

  function calculateTotal(itemsPayload = []) {
    return itemsPayload.reduce((sum, entry) => sum + entry.finalPrice * entry.quantity, 0);
  }

  function resolveApiErrorMessage(error) {
    if (!error?.response?.data) {
      return null;
    }
    const data = error.response.data;
    return (
      data.message ??
      data.error ??
      data.detail ??
      data.title ??
      data.description ??
      null
    );
  }

  function resolveApiErrorCode(error) {
    if (!error?.response?.data) {
      return null;
    }
    const data = error.response.data;
    return data.code ?? data.errorCode ?? data.error_code ?? data.statusCode ?? null;
  }

  async function checkout(options = {}) {
    if (!items.value.length || processing.value) {
      return null;
    }

    processing.value = true;
    checkoutError.value = null;

    const payloadItems = buildCheckoutItems(items.value);
    const invalidEntries = payloadItems.filter((entry) => !entry.offerId);
    if (invalidEntries.length) {
      const error = new Error("Alguns itens não possuem offerId para compra.");
      checkoutError.value = error;
      processing.value = false;
      throw error;
    }

    const seenOffers = new Set();
    const duplicatedOffers = payloadItems.filter((entry) => {
      const key = entry.offerId;
      if (seenOffers.has(key)) {
        return true;
      }
      seenOffers.add(key);
      return false;
    });
    if (duplicatedOffers.length) {
      const error = new Error("Há itens duplicados no carrinho. Remova-os antes de finalizar.");
      checkoutError.value = error;
      processing.value = false;
      throw error;
    }
    const alreadyOwned = payloadItems.filter((entry) => inventoryStore.ownsCartEntry(entry));
    if (alreadyOwned.length) {
      const error = new Error("O carrinho contém itens já adquiridos.");
      checkoutError.value = error;
      processing.value = false;
      showToast("Remova itens já adquiridos do carrinho.", "error", 3000);
      throw error;
    }
    const total = calculateTotal(payloadItems);
    const currentBalance = Number(authStore.balance ?? 0);
    if (authStore.isAuthenticated && total > currentBalance) {
      const error = new Error("Saldo insuficiente para finalizar a compra.");
      checkoutError.value = error;
      processing.value = false;
      showToast("Saldo insuficiente para finalizar a compra.", "error", 3500);
      throw error;
    }
    const payload = {
      items: payloadItems,
      currency: options.currency ?? "VB",
      total,
      metadata: {
        source: "frontend",
        cartSize: payloadItems.length,
        ...options.metadata,
      },
    };

    try {
      const response = await purchaseItems(payload);
      lastOrder.value = response?.order ?? response;
      const simulated = Boolean(lastOrder.value?.simulated);
      if (simulated) {
        showToast(
          response?.warning ?? "Checkout simulado — o backend não expôs /store/purchase.",
          "error",
          4000,
        );
      } else {
        showToast("Compra concluída!", "success", 3000);
      }
      clear({ silent: true });

      if (authStore?.refreshWallet) {
        authStore.refreshWallet().catch(() => {});
      }
      inventoryStore.load({ silent: true, force: true }).catch(() => {});

      return response;
    } catch (error) {
      const apiMessage = resolveApiErrorMessage(error);
      const apiCode = resolveApiErrorCode(error);
      const lowerMessage = apiMessage?.toLowerCase?.() ?? "";
      const looksLikeBalanceIssue =
        error?.response?.status === 400 &&
        (apiCode === "INSUFFICIENT_FUNDS" ||
          apiCode === "BALANCE_TOO_LOW" ||
          lowerMessage.includes("saldo") ||
          lowerMessage.includes("fund"));
      const friendlyMessage = looksLikeBalanceIssue
        ? "Saldo insuficiente para finalizar a compra."
        : apiMessage ?? "Não foi possível concluir a compra.";
      checkoutError.value = new Error(friendlyMessage);
      showToast(friendlyMessage, "error", 3500);
      return null;
    } finally {
      processing.value = false;
    }
  }

  return {
    items,
    toast,
    processing,
    lastOrder,
    checkoutError,
    resolveEntryKey,
    has,
    showToast,
    add,
    remove,
    clear,
    checkout,
  };
});