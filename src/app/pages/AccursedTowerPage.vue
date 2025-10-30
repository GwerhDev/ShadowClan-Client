<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useStore } from '../../middlewares/store';
import AppLayout from '../layouts/AppLayout.vue';
import { useRoute } from 'vue-router';

const store: any = useStore();
const nextWarDate = ref('');
const warTime = ref('');
const enemyClanName = ref('');
const loading = ref(true);
const route = useRoute();

const tabs = [
  { id: '1', name: 'Torre 1', icon: 'fas fa-chess-rook', path: '/accursed-tower/1', disabled: true },
  { id: '2', name: 'Torre 2', icon: 'fas fa-chess-rook', path: '/accursed-tower/2', disabled: true },
  { id: '3', name: 'Torre 3', icon: 'fas fa-chess-rook', path: '/accursed-tower/3', disabled: true },
];

onMounted(async () => {
  await store.handleGetNextShadowWar();
  if (store.currentUser.shadowWarData && store.currentUser.shadowWarData.date) {
    const warDate = new Date(store.currentUser.shadowWarData.date);
    nextWarDate.value = warDate.toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    warTime.value = warDate.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' });

    if (store.currentUser.shadowWarData.enemyClan) {
      enemyClanName.value = store.currentUser.shadowWarData.enemyClan.name;
    } else {
      enemyClanName.value = 'aun no está definido';
    }
    loading.value = false;
  } else {
    loading.value = false;
  }
});

watch(() => store.currentUser.shadowWarData, (newVal) => {
  if (newVal && newVal.date) {
    const warDate = new Date(newVal.date);
    nextWarDate.value = warDate.toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    warTime.value = warDate.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' });

    if (newVal.enemyClan) {
      enemyClanName.value = newVal.enemyClan.name;
    } else {
      enemyClanName.value = 'aun no está definido';
    }
  } else {
    nextWarDate.value = '';
    warTime.value = '';
    enemyClanName.value = '';
  }
}, { immediate: true });
</script>

<template>
  <main class="red-shadow-fx">
      <AppLayout :loading="loading" :tabs="tabs" :active-layout-tab="route.path" title="Torre Maldita">
        <span class="info-text">
          <p v-if="!loading">La próxima <b>Guerra de Torre Maldita</b> es el <i>{{ nextWarDate }} a las 20:00h (hora del
              servidor)</i>.
            Enfrentaremos al Clan:
          <h4 class="clan-name">{{ enemyClanName }}</h4>
          </p>
        </span>
        <router-view :loading="loading" />
      </AppLayout>
  </main>
</template>

<style scoped>
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
