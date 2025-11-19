import { createRouter, createWebHistory } from "vue-router";

const ShowroomView = () => import("../views/ShowroomView.vue");
const BundlesView = () => import("../views/BundlesView.vue");
const InventoryView = () => import("../views/InventoryView.vue");
const TransactionsView = () => import("../views/TransactionsView.vue");
const DirectoryView = () => import("../views/DirectoryView.vue");
const AuthView = () => import("../views/AuthView.vue");
const ProfileView = () => import("../views/ProfileView.vue");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "showroom", component: ShowroomView },
    { path: "/bundles", name: "bundles", component: BundlesView },
    { path: "/inventory", name: "inventory", component: InventoryView },
    { path: "/transactions", name: "transactions", component: TransactionsView },
    { path: "/directory", name: "directory", component: DirectoryView },
    { path: "/auth", name: "auth", component: AuthView },
    { path: "/users/:id", name: "profile", component: ProfileView },
  ],
});

export default router;