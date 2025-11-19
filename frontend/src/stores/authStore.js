import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { loginUser, registerUser, fetchProfile, fetchWallet } from "../services/authService.js";
import { setAuthToken } from "../services/apiClient.js";

const TOKEN_KEY = "fortnite_token";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const token = ref(localStorage.getItem(TOKEN_KEY));
  const wallet = ref({ balance: 0, transactions: [] });
  const loading = ref(false);
  const error = ref(null);

  if (token.value) {
    setAuthToken(token.value);
    hydrate();
  }

  const isAuthenticated = computed(() => Boolean(user.value && token.value));
  const balance = computed(() => Number(wallet.value.balance ?? 0));

  watch(token, (value) => {
    if (value) {
      localStorage.setItem(TOKEN_KEY, value);
      setAuthToken(value);
    } else {
      localStorage.removeItem(TOKEN_KEY);
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
      console.error("Failed to hydrate session", err);
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
    error,
    isAuthenticated,
    balance,
    hydrate,
    login,
    register,
    logout,
  };
});