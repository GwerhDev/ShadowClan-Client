<style scoped lang="scss" src="./SideBar.scss" />
<script setup lang="ts">
import { computed } from 'vue';
import { useStore, AppStore } from '../../middlewares/store';
import { useRoute, useRouter } from 'vue-router';

const props = withDefaults(defineProps<{
  logged: Boolean,
  tabs: Array<{
    id: string;
    name: string;
    icon: string;
    length?: number;
    path: string;
    disabled?: boolean;
  }>,
}>(), {
  tabs: () => []
});

const store: AppStore = useStore();
const route = useRoute();
const router = useRouter();

const regularTabs = computed(() => props.tabs.filter(t => t.id !== 'dashboard'));
const dashboardTab = computed(() => props.tabs.find(t => t.id === 'dashboard') ?? null);

function handleType(tab: { id: string; name: string; icon: string; length?: number; path: string; }) {
  router.push(tab.path);
}

function openDashboard(path: string) {
  window.open(path, '_blank');
}

function styleActive(path: string) {
  if (route.path === path) {
    return { backgroundColor: "var(--color-primary)" };
  }
  return {};
}
</script>

<template>
  <div class="container-lateral">
    <ul>
      <li v-for="(tab, index) in regularTabs" :key="tab.id">
        <button :title="tab.name"
          :class="{ 'first': index === 0, 'last': index === regularTabs.length - 1, 'disabled': tab.disabled }"
          @click="handleType(tab)" :style="styleActive(tab.path)" :disabled="tab.disabled">
          <i :class="tab.icon"></i>
          <span>{{ tab.name }}</span>
          <small v-if="store.currentUser.userBattleInfo.some(b => b.category === tab.id)"><i
              class="fas fa-user-shield user-battle-indicator"></i></small>
          <span v-else></span>
        </button>
      </li>
    </ul>

    <div v-if="dashboardTab" class="sidebar-bottom">
      <button class="dashboard-btn" :title="dashboardTab.name" @click="openDashboard(dashboardTab.path)">
        <div class="dashboard-btn-left">
          <i :class="dashboardTab.icon"></i>
          <span>{{ dashboardTab.name }}</span>
        </div>
        <i class="fas fa-arrow-up-right-from-square dashboard-ext-icon"></i>
      </button>
    </div>
  </div>
</template>
