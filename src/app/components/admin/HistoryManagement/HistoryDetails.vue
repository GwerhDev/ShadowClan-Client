<template>
  <div class="history-details">

    <button class="btn-back" @click="router.push('/management/history')">
      <i class="fas fa-arrow-left"></i> Volver al historial
    </button>

    <!-- Loading -->
    <template v-if="loading">
      <div class="detail-skeleton">
        <div class="skeleton-box skeleton-title"></div>
        <div class="skeleton-row">
          <div class="skeleton-box skeleton-chip"></div>
          <div class="skeleton-box skeleton-chip"></div>
        </div>
        <div class="skeleton-box skeleton-section"></div>
        <div class="skeleton-box skeleton-section"></div>
      </div>
    </template>

    <!-- Error -->
    <div v-else-if="error" class="detail-empty">
      <i class="fas fa-triangle-exclamation"></i>
      <p>Error al cargar los detalles.</p>
    </div>

    <!-- Empty -->
    <div v-else-if="!currentShadowWar" class="detail-empty">
      <i class="fas fa-scroll"></i>
      <p>No se encontraron detalles para esta Guerra Sombría.</p>
    </div>

    <!-- Content -->
    <template v-else>

      <!-- Header -->
      <div class="detail-header">
        <div class="detail-meta">
          <span class="detail-vs">vs</span>
          <h2 class="detail-enemy">{{ currentShadowWar.enemyClan?.name || 'Sin clan enemigo' }}</h2>
          <span class="detail-date">{{ formattedDateDisplay }}</span>
        </div>
        <div class="detail-actions">
          <select class="result-select" :class="selectedResult" v-model="selectedResult" @change="updateShadowWarResult">
            <option v-for="opt in shadowWarResults" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
          </select>
        </div>
      </div>

      <!-- Stats -->
      <div class="detail-stats">
        <div class="stat-card">
          <span class="stat-label">Resultado</span>
          <span :class="['result-chip', `result-${selectedResult}`]">{{ resultLabel }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Confirmados</span>
          <div class="stat-value-row">
            <span class="stat-value">{{ confirmedMembersCount }}</span>
            <button class="icon-btn" title="Ver confirmados" @click="openMembersModal">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Battles -->
      <div class="battles-grid">
        <div
          v-for="(matches, battleType) in currentShadowWar.battle"
          :key="battleType"
          class="battle-section"
        >
          <h5 class="battle-title">Batalla {{ translateBattle(battleType) }}</h5>
          <div class="matches-list">
            <div
              v-for="(match, index) in matches"
              :key="index"
              class="match-card"
              @click="openMatchDetailsModal(match)"
            >
              <div class="match-info">
                <span class="match-label">Partida {{ index + 1 }}</span>
                <span class="match-participants">
                  {{ match.group1.character.filter((m: any) => m).length + match.group2.character.filter((m: any) => m).length }}
                  participantes
                </span>
              </div>
              <span :class="['result-chip', `result-${match.result}`]">{{ translateResult(match.result) }}</span>
              <i class="fas fa-chevron-right match-arrow"></i>
            </div>
          </div>
        </div>
      </div>

    </template>

    <ConfirmedMembersModal
      v-if="showMembersModal"
      :members="currentShadowWar?.confirmed || []"
      @close="closeMembersModal"
    />
    <MatchDetailsModal
      v-if="showMatchDetailsModal"
      :match="selectedMatch"
      @close="closeMatchDetailsModal"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Match } from '../../../../interfaces';
import { translateBattle, translateResult } from '../../../../helpers/lists';
import MatchDetailsModal from './MatchDetailsModal.vue';
import ConfirmedMembersModal from './ConfirmedMembersModal.vue';
import { useStore } from '../../../../middlewares/store';

const route  = useRoute();
const router = useRouter();
const store  = useStore();

const currentShadowWar = computed(() => store.admin.currentShadowWar);

const loading             = ref(true);
const error               = ref(false);
const showMembersModal    = ref(false);
const showMatchDetailsModal = ref(false);
const selectedMatch       = ref<Match | null>(null);
const selectedResult      = ref('');

const shadowWarResults = [
  { value: 'victory', text: 'Victoria' },
  { value: 'defeat',  text: 'Derrota'  },
  { value: 'draw',    text: 'Empate'   },
  { value: 'pending', text: 'Pendiente'},
];

const resultLabel = computed(() => shadowWarResults.find(r => r.value === selectedResult.value)?.text ?? '');

watch(currentShadowWar, (val) => {
  if (val) selectedResult.value = val.result;
}, { immediate: true });

const confirmedMembersCount = computed(() => currentShadowWar.value?.confirmed?.length ?? 0);

const formattedDateDisplay = computed(() => {
  const d = currentShadowWar.value?.date;
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
});

function openMembersModal()      { showMembersModal.value = true; }
function closeMembersModal()     { showMembersModal.value = false; }
function openMatchDetailsModal(match: Match) { selectedMatch.value = match; showMatchDetailsModal.value = true; }
function closeMatchDetailsModal() { showMatchDetailsModal.value = false; selectedMatch.value = null; }

const updateShadowWarResult = async () => {
  if (!currentShadowWar.value?._id || !selectedResult.value) return;
  try {
    await store.handleUpdateShadowWar(currentShadowWar.value._id, { result: selectedResult.value });
  } catch {
    selectedResult.value = currentShadowWar.value.result;
  }
};

onMounted(async () => {
  const id = route.params.shadowwar_id as string;
  if (!id) { loading.value = false; return; }
  try {
    await store.handleGetShadowWar(id);
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss" src="./HistoryDetails.scss"></style>
