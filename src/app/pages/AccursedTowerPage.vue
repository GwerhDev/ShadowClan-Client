<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useStore } from '../../middlewares/store';
import AppLayout from '../layouts/AppLayout.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useRoute, useRouter } from 'vue-router';

const store: any = useStore();
const loading       = ref(true);
const route         = useRoute();
const router        = useRouter();
const towerDate     = ref('');
const enemyClanName = ref('');

const towerWarList = computed(() => store.currentUser.towerWarList as any[]);

// Build one sidebar tab per active tower
const tabs = computed(() =>
  towerWarList.value.map((tw: any) => ({
    id:   tw._id,
    name: `Torre ${tw.towerNumber}`,
    icon: 'fas fa-chess-rook',
    path: `/accursed-tower/${tw._id}`,
  }))
);

// The tower currently shown (matches the :accursedtower_id param)
const selectedTower = computed(() => {
  const id = route.params.accursedtower_id as string;
  if (!id) return null;
  return towerWarList.value.find((tw: any) => tw._id === id) ?? null;
});

watch(selectedTower, (tower) => {
  if (tower?.date) {
    towerDate.value     = new Date(tower.date).toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    enemyClanName.value = tower.enemyClan?.name ?? 'aún no está definido';
  } else {
    towerDate.value     = '';
    enemyClanName.value = '';
  }
}, { immediate: true });

onMounted(async () => {
  loading.value = true;
  try {
    await store.handleGetActiveTowerWar();
    const list = towerWarList.value;
    if (list.length > 0 && route.path === '/accursed-tower') {
      router.replace(`/accursed-tower/${list[0]._id}`);
    }
  } finally {
    loading.value = false;
  }
});
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
        v-else-if="towerWarList.length === 0"
        icon="fas fa-chess-rook"
        message="No hay un enfrentamiento de Torre Maldita programado."
      />

      <template v-else-if="selectedTower">
        <div class="tw-info">
          <p>El próximo enfrentamiento de <b>Torre Maldita N° {{ selectedTower.towerNumber }}</b> es el <i>{{ towerDate }} a las 20:00h (hora del servidor)</i>. Enfrentaremos al Clan:</p>
          <h4 class="tw-clan-name">{{ enemyClanName }}</h4>
        </div>
        <router-view />
      </template>

    </AppLayout>
  </main>
</template>

<style scoped>
.tw-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-inline: 1rem;
  text-align: center;
}

.tw-clan-name {
  font-size: 2rem;
}
</style>
