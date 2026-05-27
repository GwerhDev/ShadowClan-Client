<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '../../../../middlewares/store';
import ShadowWarMemberCard from '../../ShadowWar/ShadowWarMemberCard.vue';

const route  = useRoute();
const router = useRouter();
const store: any = useStore();

const loading = ref(true);
const error   = ref<string | null>(null);

const tower = computed(() => store.admin.currentAccursedTower);

const groupSizes = { group1: 4, group2: 4, group3: 2 } as const;

function padGroup(arr: any[] | undefined, size: number): (any | undefined)[] {
  const result = [...(arr ?? [])];
  while (result.length < size) result.push(undefined);
  return result;
}

onMounted(async () => {
  try {
    await store.handleGetAccursedTowerDetails(route.params.tower_id as string);
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <button class="btn-back" @click="router.push('/management/history')">
      <i class="fas fa-arrow-left"></i> Volver al historial
    </button>
    <h2>Detalles de la Torre Maldita</h2>

    <div v-if="loading">Cargando...</div>

    <div v-else-if="error">
      <p>Error al cargar los detalles: {{ error }}</p>
    </div>

    <template v-else-if="tower">
      <p>Clan Enemigo:</p>
      <h4 class="featured">{{ tower.enemyClan?.name || 'N/A' }}</h4>

      <small class="date-container">
        <input readonly type="date" :value="tower.date ? tower.date.slice(0, 10) : ''" />
      </small>

      <div class="info-container">
        <ul class="blocks-section">
          <li>
            <p>Torre N°: <strong>{{ tower.towerNumber }}</strong></p>
          </li>
        </ul>
      </div>

      <div v-if="tower.roster" class="battle-section">
        <!-- Grupos 1 y 2 -->
        <div class="tw-groups-row">
          <div v-for="grp in (['group1', 'group2'] as const)" :key="grp" class="tw-group">
            <h4>{{ grp === 'group1' ? 'Grupo 1' : 'Grupo 2' }}</h4>
            <div class="tw-cards-col">
              <ShadowWarMemberCard
                v-for="(character, idx) in padGroup(tower.roster[grp], groupSizes[grp])"
                :key="idx"
                :character="character"
                :is-linked="false"
                :confirmed-ids="[]"
              />
            </div>
          </div>
        </div>

        <!-- Grupo 3 -->
        <div class="tw-group3">
          <h4>Grupo 3</h4>
          <div class="tw-cards-row">
            <ShadowWarMemberCard
              v-for="(character, idx) in padGroup(tower.roster.group3, groupSizes.group3)"
              :key="idx"
              :character="character"
              :is-linked="false"
              :confirmed-ids="[]"
            />
          </div>
        </div>
      </div>
    </template>

    <div v-else>
      <p>No se encontraron detalles para esta Torre Maldita.</p>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./HistoryDetails.scss"></style>

<style scoped>
.tw-groups-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
}

.tw-group {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.tw-cards-col {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.tw-group3 {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.tw-cards-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .5rem;
}
</style>
