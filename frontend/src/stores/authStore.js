import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { loginUser, registerUser, fetchProfile, fetchWallet } from "../services/authService.js";
import { setAuthToken } from "../services/apiClient.js";

function coerceNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    // Remove currency symbols/letters while keeping separators.
    let normalized = trimmed.replace(/[^0-9.,-]/g, "");
    const thousandDotPattern = /^\d{1,3}(\.\d{3})+(,\d+)?$/;
    const thousandCommaPattern = /^\d{1,3}(,\d{3})+(\.\d+)?$/;

    if (thousandDotPattern.test(normalized)) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else if (thousandCommaPattern.test(normalized)) {
      normalized = normalized.replace(/,/g, "");
    } else if (normalized.includes(",") && !normalized.includes(".")) {
      normalized = normalized.replace(",", ".");
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function deriveBalance(summary = {}) {
  if (!summary || typeof summary !== "object") {
    return 0;
  }

  const directKeys = [
    "totalBalance",
    "total_balance",
    "total",
    "availableBalance",
    "available_balance",
    "available",
    "saldo",
    "balance",
    "currentBalance",
    "current_balance",
    "walletBalance",
    "wallet_balance",
    "vbucks",
    "vb",
    "amount",
    "value",
  ];

  const candidates = [];

  for (const key of directKeys) {
    const candidate = coerceNumber(summary[key]);
    if (candidate !== null) {
      candidates.push(candidate);
    }
  }

  if (summary.balances && typeof summary.balances === "object") {
    const nestedKeys = ["total", "available", "bonus", "balance"];
    for (const key of nestedKeys) {
      const candidate = coerceNumber(summary.balances[key]);
      if (candidate !== null) {
        candidates.push(candidate);
      }
    }

    const available = coerceNumber(summary.balances.available);
    const bonus = coerceNumber(summary.balances.bonus);
    if (available !== null || bonus !== null) {
      candidates.push((available ?? 0) + (bonus ?? 0));
    }
  }

  if (Array.isArray(summary.components)) {
    const sum = summary.components.reduce((total, component) => {
      const amount = coerceNumber(component?.amount ?? component?.value);
      return total + (amount ?? 0);
    }, 0);
    if (sum > 0) {
      candidates.push(sum);
    }
  }

  if (!candidates.length) {
    return 0;
  }

  return Math.max(...candidates);
}

const TOKEN_KEY = "fortnite_token";
const hasWindow = typeof window !== "undefined";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const token = ref(hasWindow ? localStorage.getItem(TOKEN_KEY) : null);
  const wallet = ref({ balance: 0, transactions: [] });
  const loading = ref(false);
  const walletLoading = ref(false);
  const error = ref(null);

  if (token.value) {
    setAuthToken(token.value);
    hydrate();
  }

  const isAuthenticated = computed(() => Boolean(user.value && token.value));
  const balance = computed(() => deriveBalance(wallet.value));

  watch(token, (value) => {
    if (value) {
      if (hasWindow) {
        localStorage.setItem(TOKEN_KEY, value);
      }
      setAuthToken(value);
    } else {
      if (hasWindow) {
        localStorage.removeItem(TOKEN_KEY);
      }
      setAuthToken(null);
    }
  });

  async function hydrate() {
    if (!token.value) {
      return;
    }
    loading.value = true;
    try {
      const [me, walletSummary] = await Promise.all([fetchProfile(), fetchWallet()]);
      user.value = me;
      wallet.value = walletSummary;
      error.value = null;
    } catch (err) {
      logout();
      error.value = err;
    } finally {
      loading.value = false;
    }
  }

  async function login(credentials) {
    loading.value = true;
    try {
      const { token: authToken, user: profile } = await loginUser(credentials);
      token.value = authToken;
      user.value = profile;
      await hydrate();
      return profile;
    } finally {
      loading.value = false;
    }
  }

  async function register(payload) {
    loading.value = true;
    try {
      const { token: authToken, user: profile } = await registerUser(payload);
      token.value = authToken;
      user.value = profile;
      await hydrate();
      return profile;
    } finally {
      loading.value = false;
    }
  }

  async function refreshProfile() {
    if (!token.value) {
      return null;
    }
    const me = await fetchProfile();
    user.value = me;
    return me;
  }

  async function refreshWallet(params = {}) {
    if (!token.value) {
      return null;
    }
    walletLoading.value = true;
    try {
      const walletSummary = await fetchWallet(params);
      wallet.value = walletSummary;
      return walletSummary;
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      walletLoading.value = false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    wallet.value = { balance: 0, transactions: [] };
  }

  return {
    user,
    token,
    wallet,
    loading,
    walletLoading,
    error,
    isAuthenticated,
    balance,
    hydrate,
    refreshProfile,
    refreshWallet,
    login,
    register,
    logout,
  };
});