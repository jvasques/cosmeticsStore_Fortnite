import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore.js";

const ShowroomView = () => import("../views/ShowroomView.vue");
const BundlesView = () => import("../views/BundlesView.vue");
const InventoryView = () => import("../views/InventoryView.vue");
const TransactionsView = () => import("../views/TransactionsView.vue");
const CommunityView = () => import("../views/CommunityView.vue");
const AuthView = () => import("../views/AuthView.vue");
const ProfileView = () => import("../views/ProfileView.vue");
const NotFoundView = () => import("../views/NotFoundView.vue");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "showroom", component: ShowroomView },
    { path: "/bundles", name: "bundles", component: BundlesView },
    { path: "/inventory", name: "inventory", component: InventoryView },
    { path: "/transactions", name: "transactions", component: TransactionsView },
    { path: "/community", name: "community", component: CommunityView },
    { path: "/auth", name: "auth", component: AuthView, meta: { guestOnly: true } },
    { path: "/users/:id", name: "profile", component: ProfileView },
    { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  const hasToken = !!auth.token;

  if (to.meta.guestOnly && hasToken) {
    return { name: "showroom" };
  }
});

export default router;