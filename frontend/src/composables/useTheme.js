import { ref, watch } from "vue";
import { usePreferredDark } from "@vueuse/core";

const hasWindow = typeof window !== "undefined";
const stored = hasWindow ? localStorage.getItem("fortnite_theme") ?? "system" : "system";
const theme = ref(stored);
const preferredDark = usePreferredDark();
const resolvedTheme = ref("light");

function applyTheme(value) {
  if (!hasWindow) {
    return;
  }
  const root = document.documentElement;
  const nextTheme = value === "system" ? (preferredDark.value ? "dark" : "light") : value;
  resolvedTheme.value = nextTheme;

  if (nextTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

watch(
  theme,
  (value) => {
    if (hasWindow) {
      localStorage.setItem("fortnite_theme", value);
    }
    applyTheme(value);
  },
  { immediate: true }
);

watch(preferredDark, () => {
  if (theme.value === "system") {
    applyTheme("system");
  }
});

function cycleTheme() {
  const order = ["light", "dark", "system"];
  const currentIndex = order.indexOf(theme.value);
  const next = order[(currentIndex + 1) % order.length];
  theme.value = next;
}

export function useTheme() {
  return {
    theme,
    resolvedTheme,
    cycleTheme,
  };
}