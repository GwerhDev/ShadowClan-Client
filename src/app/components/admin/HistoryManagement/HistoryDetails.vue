<template>
  <div class="history-details">

    <button class="btn-back" @click="router.push('/management/history')">
      <i class="fas fa-arrow-left"></i> Volver al historial
    </button>

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

    <div v-else-if="error" class="detail-empty">
      <i class="fas fa-triangle-exclamation"></i>
      <p>Error al cargar los detalles.</p>
    </div>

    <div v-else-if="!currentShadowWar" class="detail-empty">
      <i class="fas fa-scroll"></i>
      <p>No se encontraron detalles para esta Guerra Sombría.</p>
    </div>

    <template v-else>

      <div class="detail-header">
        <div class="detail-meta">
          <span class="detail-vs">vs</span>
          <h2 class="detail-enemy">{{ currentShadowWar.enemyClan?.name || 'Sin clan enemigo' }}</h2>
          <span class="detail-date">{{ formattedDateDisplay }}</span>
        </div>
        <div class="detail-actions">
          <select class="result-select" v-model="selectedResult" @change="updateShadowWarResult">
            <option v-for="opt in shadowWarResults" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
          </select>

          <template v-if="confirmDelete">
            <button class="ctx-confirm-btn" @click="handleDelete" :disabled="saving">
              <i class="fas fa-check"></i> Confirmar
            </button>
            <button class="ctx-cancel-btn" @click="confirmDelete = false">
              <i class="fas fa-times"></i>
            </button>
          </template>

          <template v-else-if="editing">
            <button class="ctx-confirm-btn" @click="saveEdit" :disabled="saving">
              <i class="fas fa-check"></i> Guardar
            </button>
            <button class="ctx-cancel-btn" @click="cancelEdit">
              <i class="fas fa-times"></i>
            </button>
          </template>

          <div v-else class="ctx-wrapper">
            <button class="btn-dots" @click.stop="toggleCtx">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <Teleport to="body">
              <template v-if="showCtx">
                <div class="ctx-overlay" @click="showCtx = false" />
                <div class="ctx-menu-fixed" :style="{ top: ctxPos.top + 'px', left: ctxPos.left + 'px', transform: 'translateX(-100%)' }">
                  <button class="ctx-item" @click="openEdit">
                    <i class="fas fa-pen"></i> Editar
                  </button>
                  <button class="ctx-item" @click="toggleCompleted" :disabled="saving">
                    <i :class="currentShadowWar?.completed ? 'fas fa-rotate-left' : 'fas fa-flag-checkered'"></i>
                    {{ currentShadowWar?.completed ? 'Marcar activa' : 'Completar' }}
                  </button>
                  <button class="ctx-item ctx-item--danger" @click="confirmDelete = true; showCtx = false">
                    <i class="fas fa-trash"></i> Eliminar
                  </button>
                </div>
              </template>
            </Teleport>
          </div>
        </div>
      </div>

      <!-- Edit mode fields -->
      <div v-if="editing" class="edit-fields-row">
        <div class="edit-field">
          <label>Fecha</label>
          <input type="date" v-model="editDate" />
        </div>
        <div class="edit-field edit-field--grow">
          <label>Clan Enemigo <span class="optional-tag">opcional</span></label>
          <SearchSelector
            v-model="editEnemyClan"
            :fetch-fn="searchClans"
            :selected-label="currentShadowWar.enemyClan?.name"
            placeholder="Buscar clan..."
          />
        </div>
      </div>

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
import SearchSelector from '../../Selectors/SearchSelector.vue';
import { useStore } from '../../../../middlewares/store';
import { searchClans, closeShadowWarManagement, updateShadowWarClan } from '../../../../middlewares/services';

const route  = useRoute();
const router = useRouter();
const store  = useStore();

const currentShadowWar    = computed(() => store.admin.currentShadowWar);
const loading             = ref(true);
const error               = ref(false);
const saving              = ref(false);
const showMembersModal    = ref(false);
const showMatchDetailsModal = ref(false);
const selectedMatch       = ref<Match | null>(null);
const selectedResult      = ref('');
const showCtx             = ref(false);
const ctxPos              = ref({ top: 0, left: 0 });
const confirmDelete       = ref(false);
const editing             = ref(false);
const editDate            = ref('');
const editEnemyClan       = ref('');

const shadowWarResults = [
  { value: 'victory', text: 'Victoria' },
  { value: 'defeat',  text: 'Derrota'  },
  { value: 'draw',    text: 'Empate'   },
  { value: 'pending', text: 'Pendiente'},
];

const resultLabel = computed(() => shadowWarResults.find(r => r.value === selectedResult.value)?.text ?? '');
const confirmedMembersCount = computed(() => currentShadowWar.value?.confirmed?.length ?? 0);

const formattedDateDisplay = computed(() => {
  const d = currentShadowWar.value?.date;
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
});

watch(currentShadowWar, (val) => {
  if (val) selectedResult.value = val.result;
}, { immediate: true });

function toggleCtx(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  ctxPos.value = { top: rect.bottom + 4, left: rect.right };
  showCtx.value = !showCtx.value;
}

function openEdit() {
  const sw = currentShadowWar.value;
  editDate.value = sw?.date ? new Date(sw.date).toISOString().slice(0, 10) : '';
  editEnemyClan.value = sw?.enemyClan?._id ?? '';
  editing.value = true;
  showCtx.value = false;
}

function cancelEdit() {
  editing.value = false;
  confirmDelete.value = false;
}

async function saveEdit() {
  if (!currentShadowWar.value?._id) return;
  saving.value = true;
  try {
    await updateShadowWarClan(currentShadowWar.value._id, {
      date:      editDate.value || undefined,
      enemyClan: editEnemyClan.value || null,
      result:    selectedResult.value,
    });
    await store.handleGetShadowWar(currentShadowWar.value._id);
    editing.value = false;
  } finally {
    saving.value = false;
  }
}

async function toggleCompleted() {
  if (!currentShadowWar.value?._id) return;
  saving.value = true;
  showCtx.value = false;
  try {
    const newCompleted = !currentShadowWar.value.completed;
    await updateShadowWarClan(currentShadowWar.value._id, { completed: newCompleted, characterId: store.currentCharacter });
    await store.handleGetShadowWar(currentShadowWar.value._id);
    if (newCompleted) router.push('/management/history');
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!currentShadowWar.value?._id) return;
  saving.value = true;
  try {
    await closeShadowWarManagement(currentShadowWar.value._id);
    store.admin.history = (store.admin.history ?? []).filter((w: any) => w._id !== currentShadowWar.value!._id);
    if (store.currentUser.shadowWarData?._id === currentShadowWar.value._id) {
      store.currentUser.shadowWarData = null;
    }
    router.push('/management/history');
  } finally {
    saving.value = false;
  }
}

const updateShadowWarResult = async () => {
  if (!currentShadowWar.value?._id || !selectedResult.value) return;
  try {
    await store.handleUpdateShadowWar(currentShadowWar.value._id, { result: selectedResult.value });
  } catch {
    selectedResult.value = currentShadowWar.value.result;
  }
};

function openMembersModal()      { showMembersModal.value = true; }
function closeMembersModal()     { showMembersModal.value = false; }
function openMatchDetailsModal(match: Match) { selectedMatch.value = match; showMatchDetailsModal.value = true; }
function closeMatchDetailsModal() { showMatchDetailsModal.value = false; selectedMatch.value = null; }

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
