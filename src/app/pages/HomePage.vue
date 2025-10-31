<script setup lang="ts">
import { ref } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';

const tabs = [
  { id: 'home', name: 'Inicio', icon: 'fas fa-home', path: '/' },
  { id: 'clan', name: 'Clan', icon: 'fas fa-shield-alt', path: '/c/clan' },
  { id: 'history', name: 'Historial', icon: 'fas fa-history', path: '/c/history' },
];

const loading = ref(true);

</script>

<template>
  <main class="red-shadow-fx">
    <div class="div-container">
      <AppLayout :loading="loading" :tabs="tabs">
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
