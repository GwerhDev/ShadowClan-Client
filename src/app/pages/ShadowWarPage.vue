<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from '../../middlewares/store';
import AppLayout from '../layouts/AppLayout.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useRoute, useRouter } from 'vue-router';

const store: any = useStore();
const nextWarDate    = ref('');
const enemyClanName  = ref('');
const loading        = ref(true);
const route          = useRoute();
const router         = useRouter();

const shadowWarData = computed(() => store.currentUser.shadowWarData);

const tabs = computed(() => {
  if (!shadowWarData.value) return [];
  return [
    { id: 'exalted', name: 'Sublime',   icon: 'fas fa-crown',       path: '/shadow-war/exalted' },
    { id: 'eminent', name: 'Eminente',  icon: 'fas fa-trophy',      path: '/shadow-war/eminent' },
    { id: 'famed',   name: 'Célebre',   icon: 'fas fa-medal',       path: '/shadow-war/famed'   },
    { id: 'proud',   name: 'Imponente', icon: 'fas fa-fist-raised',  path: '/shadow-war/proud'  },
  ];
});

onMounted(async () => {
  loading.value = true;
  try {
    await store.handleGetNextShadowWar();
    // Redirigir a la primera pestaña solo si hay una instancia activa y
    // el usuario llegó a la raíz /shadow-war (sin subruta)
    if (store.currentUser.shadowWarData && route.path === '/shadow-war') {
      router.replace('/shadow-war/exalted');
    }
  } finally {
    loading.value = false;
  }
});

watch(shadowWarData, (newVal) => {
  if (newVal?.date) {
    const warDate = new Date(newVal.date);
    nextWarDate.value   = warDate.toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    enemyClanName.value = newVal.enemyClan?.name ?? 'aún no está definido';
  } else {
    nextWarDate.value   = '';
    enemyClanName.value = '';
  }
}, { immediate: true });
</script>

<template>
  <main class="red-shadow-fx">
    <AppLayout :loading="loading" :tabs="tabs" :active-layout-tab="route.path">

      <EmptyState
        v-if="loading"
        icon="fas fa-spinner fa-spin"
        message="Cargando..."
      />

      <EmptyState
        v-else-if="!shadowWarData"
        icon="fas fa-shield-alt"
        message="No hay una Guerra Sombría programada esta semana."
      />

      <template v-else>
        <div class="sw-info">
          <p>La próxima <b>Guerra Sombría</b> es el <i>{{ nextWarDate }} a las 19:30h (hora del servidor)</i>. Enfrentaremos al Clan:</p>
          <h4 class="sw-clan-name">{{ enemyClanName }}</h4>
        </div>
        <router-view :loading="loading" />
      </template>

    </AppLayout>
  </main>
</template>

<style scoped>
.sw-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-inline: 1rem;
  text-align: center;
}

.sw-clan-name {
  font-size: 2rem;
}
</style>
