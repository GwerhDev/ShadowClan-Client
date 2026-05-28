<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '../../../../middlewares/store';
import ShadowWarMemberCard from '../../ShadowWar/ShadowWarMemberCard.vue';

const route  = useRoute();
const router = useRouter();
const store: any = useStore();

const loading       = ref(true);
const error         = ref<string | null>(null);
const confirmDelete = ref(false);

const tower = computed(() => store.admin.currentAccursedTower);

const deleteTower = async () => {
  await store.handleDeleteTowerWar(route.params.tower_id as string);
  router.push('/management/history');
};

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
    <div class="details-header">
      <button class="btn-back" @click="router.push('/management/history')">
        <i class="fas fa-arrow-left"></i> Volver al historial
      </button>
      <template v-if="tower && !loading">
        <template v-if="confirmDelete">
          <button class="btn-delete btn-delete--confirm" @click="deleteTower">
            <i class="fas fa-check"></i> Confirmar
          </button>
          <button class="btn-back" @click="confirmDelete = false">
            <i class="fas fa-times"></i> Cancelar
          </button>
        </template>
        <button v-else class="btn-delete" @click="confirmDelete = true">
          <i class="fas fa-trash"></i> Eliminar
        </button>
      </template>
    </div>
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
.details-header {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin-bottom: 1rem;
}

.details-header .btn-back {
  margin-bottom: 0;
}

.btn-delete {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .35rem .9rem;
  border-radius: 6px;
  font-size: 0.82rem;
  background: transparent;
  border: 1px solid rgba(239, 68, 68, .3);
  color: rgba(239, 68, 68, .7);
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;

  &:hover {
    background: rgba(239, 68, 68, .08);
    border-color: rgba(239, 68, 68, .5);
    color: #f87171;
  }

  &--confirm {
    border-color: rgba(34, 197, 94, .3);
    color: rgba(34, 197, 94, .8);
    &:hover {
      background: rgba(34, 197, 94, .08);
      border-color: rgba(34, 197, 94, .5);
      color: #4ade80;
    }
  }
}

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
