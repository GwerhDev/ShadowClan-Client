<style scoped lang="scss" src="./SideBar.scss" />
<script setup lang="ts">
import { useStore, AppStore } from '../../middlewares/store';
import { useRoute, useRouter } from 'vue-router';

withDefaults(defineProps<{
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

function handleType(tab: { id: string; name: string; icon: string; length?: number; path: string; }) {
  router.push(tab.path);
};

function styleActive(path: string) {
  if (route.path === path) {
    return { backgroundColor: "var(--color-primary)" };
  }
  return {};
};

</script>

<template>
  <div class="container-lateral">
    <ul>
      <li v-for="(tab, index) in tabs" :key="tab.id">
        <button
          :title="tab.name"
          :class="{ 'first': index === 0, 'last': index === tabs.length - 1, 'disabled': tab.disabled }"
          @click="handleType(tab)"
          :style="styleActive(tab.path)"
          :disabled="tab.disabled"
        >
          <i :class="tab.icon"></i>
          <span>{{ tab.name }}</span>
          <small v-if="store.currentUser.userBattleInfo.some(b => b.category === tab.id)"><i class="fas fa-user-shield user-battle-indicator"></i></small>
          <span v-else></span>
        </button>
      </li>
    </ul>
  </div>
</template>
