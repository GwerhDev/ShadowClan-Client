<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useStore } from '../../../middlewares/store';
import AppLayout from '../../layouts/AppLayout.vue';
import DeniedAccess from '../../utils/DeniedAccess.vue';

const store: any = useStore();
const route = useRoute();

const tabs = [
  { id: 'clan',           name: 'Clan',     icon: 'fas fa-users',      path: '/management/clan' },
  { id: 'shadow-war',     name: 'Guerra',   icon: 'fas fa-khanda',     path: '/management/shadow-war' },
  { id: 'accursed-tower', name: 'Torre',    icon: 'fas fa-chess-rook', path: '/management/accursed-tower' },
  { id: 'history',        name: 'Historial', icon: 'fas fa-history',    path: '/management/history' },
];
</script>

<template>
  <main class="red-shadow-fx" v-if="store.currentUser?.logged">
    <div class="div-container">
      <AppLayout
        :logged="store.currentUser.logged"
        :tabs="tabs"
        :active-layout-tab="route.path"
        title="Gestión de Clan"
      >
        <router-view />
      </AppLayout>
    </div>
  </main>
  <div v-else class="div-container-denied">
    <DeniedAccess />
  </div>
</template>

<style scoped>
.div-container-denied {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.div-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1100px) {
  .div-container {
    padding: 0;
  }
}
</style>
