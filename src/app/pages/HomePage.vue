<script setup lang="ts">
import { computed } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import WalkerHomeComponent from '../components/Walker/WalkerHomeComponent.vue';
import { useStore } from '../../middlewares/store';

const store: any = useStore();
const role     = computed(() => store.currentUser.userData?.role);
const isAdmin  = computed(() => role.value === 'admin' || role.value === 'super_admin');
const activeChar = computed(() => {
  const chars = store.currentUser.userData?.character ?? [];
  return chars.find((c: any) => c._id === store.currentCharacter) ?? chars[0] ?? null;
});
const hasCharacter = computed(() => (store.currentUser.userData?.character ?? []).length > 0);
const isWalker     = computed(() => !isAdmin.value && !activeChar.value?.clan);

const tabs = computed(() => {
  if (!hasCharacter.value) return [
    { id: 'welcome', name: 'Bienvenida', icon: 'fas fa-door-open', path: '/' },
  ];
  if (isWalker.value) return [
    { id: 'home', name: 'Inicio', icon: 'fas fa-home', path: '/' },
  ];
  return [
    { id: 'home',    name: 'Inicio',    icon: 'fas fa-home',       path: '/' },
    { id: 'clan',    name: 'Clan',      icon: 'fas fa-shield-alt', path: '/c/clan' },
    { id: 'history', name: 'Historial', icon: 'fas fa-history',    path: '/c/history' },
  ];
});
</script>

<template>
  <main class="red-shadow-fx">
    <div class="div-container">
      <AppLayout :tabs="tabs" :hide-title="isWalker">
        <WalkerHomeComponent v-if="isWalker" />
        <router-view v-else />
      </AppLayout>
    </div>
  </main>
</template>

<style scoped>
.div-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1100px) {
  .div-container { padding: 0; }
}
</style>
