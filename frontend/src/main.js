import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/authStore.js";
import "./style.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

const authStore = useAuthStore(pinia);

router.beforeEach((to, from, next) => {
	if (to.meta?.guestOnly && authStore.isAuthenticated) {
		next({ name: "showroom" });
		return;
	}
	next();
});

app.use(router);
app.mount("#app");