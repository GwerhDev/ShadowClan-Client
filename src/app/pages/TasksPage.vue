<script setup lang="ts">
import AppLayout from '../layouts/AppLayout.vue';
import { ref } from 'vue';

const loading = ref(false); // This can be connected to a real loading state later

const tabs = [
  { id: 'mytasks', name: 'Mis Tareas', icon: 'fas fa-user', path: '/tasks/my-tasks' },
  { id: 'clantasks', name: 'Clan', icon: 'fas fa-shield-alt', path: '/tasks/clan-tasks' },
  { id: 'warband', name: 'Cofradía', icon: 'fas fa-users', path: '/tasks/warband', disabled: true },
  { id: 'calendar', name: 'Calendario', icon: 'fas fa-calendar-alt', path: '/tasks/calendar', disabled: true },
];
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-text {
  display: flex;
  justify-content: center;
  padding-inline: 1rem;
}

.clan-name {
  font-size: 2rem;
}

@media (max-width: 1100px) {
  .div-container {
    padding: 0;
  }
}
</style>
