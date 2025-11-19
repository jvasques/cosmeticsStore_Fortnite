<script setup>
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/vue/24/outline";
import { useTheme } from "../../composables/useTheme.js";

const { theme, resolvedTheme, cycleTheme } = useTheme();

const iconMap = {
  light: SunIcon,
  dark: MoonIcon,
  system: ComputerDesktopIcon,
};
</script>

<template>
  <button
    class="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/15"
    type="button"
    @click="cycleTheme"
  >
    <component :is="iconMap[resolvedTheme]" class="h-4 w-4" />
    <span class="uppercase tracking-wide text-xs">{{ theme }}</span>
  </button>
</template>