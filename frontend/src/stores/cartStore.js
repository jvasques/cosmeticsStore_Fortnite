import { defineStore } from "pinia";
import { ref } from "vue";

export const useCartStore = defineStore("cart", () => {
  const items = ref([]);
  const toast = ref(null);

  function add(item) {
    const id = item.id ?? item.offerId;
    if (!id) {
      return;
    }
    if (items.value.some((entry) => (entry.id ?? entry.offerId) === id)) {
      toast.value = "Item já no carrinho";
      return;
    }
    items.value.push(item);
    toast.value = `${item.name ?? item.bundleName} adicionado`;
    setTimeout(() => (toast.value = null), 2000);
  }

  function remove(id) {
    items.value = items.value.filter((item) => (item.id ?? item.offerId) !== id);
  }

  function clear() {
    items.value = [];
  }

  function checkout() {
    console.info("Checkout placeholder", items.value);
    toast.value = "Compra enviada para o backend (mock)";
    setTimeout(() => (toast.value = null), 2500);
  }

  return {
    items,
    toast,
    add,
    remove,
    clear,
    checkout,
  };
});