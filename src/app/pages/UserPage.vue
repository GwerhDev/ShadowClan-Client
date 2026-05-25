<script setup lang="ts">
import { computed } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import { useStore } from '../../middlewares/store';

const store: any = useStore();

const tabs = computed(() => {
  const role    = store.currentUser.userData?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';
  return [
    { id: 'profile',   name: 'Perfil',   icon: 'fas fa-user', path: '/u/profile' },
    { id: 'account',   name: 'Cuenta',   icon: 'fas fa-gear', path: '/u/account' },
    ...(isAdmin ? [{ id: 'dashboard', name: 'Dashboard', icon: 'fas fa-lock', path: '/a/dashboard' }] : []),
  ];
});
</script>

<template>
  <main class="red-shadow-fx">
    <div class="div-container">
      <AppLayout :tabs="tabs">
        <router-view />
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
  .div-container {
    padding: 0;
  }
}
</style>
