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

      <!-- EDIT MODE: self-contained block -->
      <template v-if="editing">
        <div class="edit-block">
          <div class="edit-block-fields">
            <div class="edit-field">
              <label>Fecha</label>
              <input type="date" v-model="editDate" />
            </div>
            <div class="edit-field edit-field--grow">
              <label>Clan Enemigo <span class="optional-tag">opcional</span></label>
              <SearchSelector
                v-model="editEnemyClan"
                :fetch-fn="searchClans"
                :selected-label="editEnemyClanName || currentShadowWar.enemyClan?.name"
                placeholder="Buscar clan..."
                create-label="Crear clan enemigo"
                @create="showCreateClanModal = true"
                @clear="editEnemyClanName = ''"
              />
            </div>
          </div>
          <div class="edit-block-actions">
            <button class="ctx-confirm-btn" @click="saveEdit" :disabled="saving">
              <i class="fas fa-check"></i> Guardar
            </button>
            <button class="ctx-cancel-btn" @click="cancelEdit">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </template>

      <!-- NORMAL / ATTENDANCE mode -->
      <template v-else>

        <!-- Header -->
        <div class="detail-header">
          <div class="detail-meta">
            <span class="detail-vs">vs</span>
            <h2 class="detail-enemy">{{ currentShadowWar.enemyClan?.name || 'Sin clan enemigo' }}</h2>
            <span class="detail-date">{{ formattedDateDisplay }}</span>
          </div>
          <div class="detail-actions">
            <template v-if="confirmDelete">
              <button class="ctx-confirm-btn" @click="handleDelete" :disabled="saving">
                <i class="fas fa-check"></i> Confirmar
              </button>
              <button class="ctx-cancel-btn" @click="confirmDelete = false">
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
                    <button class="ctx-item" @click="openAttendance">
                      <i class="fas fa-clipboard-list"></i> Ver asistencia
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

      </template>

      <!-- Stats — always visible -->
      <div class="detail-stats">
        <div class="stat-card">
          <span class="stat-label">Resultado</span>
          <div class="stat-card-row">
            <select v-if="editingResult" class="result-select" v-model="editResultValue">
              <option v-for="opt in shadowWarResults" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
            </select>
            <span v-else :class="['result-chip', `result-${selectedResult}`]">{{ resultLabel }}</span>
            <template v-if="editingResult">
              <button class="stat-edit-confirm" @click="saveResult" :disabled="saving"><i class="fas fa-check"></i></button>
              <button class="stat-edit-cancel" @click="cancelEditResult"><i class="fas fa-times"></i></button>
            </template>
            <button v-else class="stat-edit-btn" @click="openEditResult"><i class="fas fa-pen"></i></button>
          </div>
        </div>
        <SWScoreCard :battle="displayBattle" />
      </div>

      <!-- Battles -->
      <div class="battles-section">
        <HistoryBattleCard
          v-for="(matches, battleType) in displayBattle"
          :key="battleType"
          :battle-type="String(battleType)"
          :matches="matches as any[]"
          :buffer="formationEditBuffer[String(battleType)]"
          :editing="formationEditCats.includes(String(battleType))"
          :expanded="expandedCategories.includes(String(battleType))"
          :saving="saving"
          :drag-source-key="dragSource ? slotKey(dragSource) : null"
          :drag-over-key="dragOverKey"
          :confirmed-ids="confirmedIdsArray"
          :declined-ids="declinedIdsArray"
          :assigned-ids="assignedMemberIds"
          @toggle="toggleCategory(String(battleType))"
          @set-result="(mIdx, result) => setResult(String(battleType), mIdx, result)"
          @select="openSlotSelection"
          @unassign="unassignSlot"
          @dragstart="onDragStart"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
          @dragend="onDragEnd"
        />
      </div>

    </template>

    <ConfirmedMembersModal
      v-if="showMembersModal"
      :members="currentShadowWar?.confirmed || []"
      @close="closeMembersModal"
    />
    <MatchDetailsModal
      v-if="showMatchDetailsModal && !editing"
      :match="selectedMatch"
      @close="closeMatchDetailsModal"
    />

    <MemberSelectionModal
      v-if="showMemberPicker"
      :characters="clanMembers"
      :assigned-member-ids="assignedMemberIds"
      :confirmed-ids="confirmedIdsArray"
      :assigned-details="assignedMemberDetails"
      @close="showMemberPicker = false"
      @character-selected="handleMemberSelected"
      @character-unassigned="handleMemberUnassigned"
    />

    <!-- Modal de asistencia -->
    <HistoryAttendanceModal
      v-if="showAttendanceModal"
      :battle="currentShadowWar?.battle"
      @close="showAttendanceModal = false"
    />

  </div>

  <!-- Create enemy clan modal -->
  <CreateEnemyClanModal
    v-if="showCreateClanModal"
    @close="showCreateClanModal = false"
    @created="handleClanCreated"
  />

</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Match } from '../../../../interfaces';
import MatchDetailsModal from './MatchDetailsModal.vue';
import ConfirmedMembersModal from './ConfirmedMembersModal.vue';
import HistoryBattleCard from './HistoryBattleCard.vue';
import HistoryAttendanceModal from './HistoryAttendanceModal.vue';
import SWScoreCard from './SWScoreCard.vue';
import MemberSelectionModal from '../ShadowWarManagement/MemberSelectionModal.vue';
import SearchSelector from '../../Selectors/SearchSelector.vue';
import CreateEnemyClanModal from '../../Modals/CreateEnemyClanModal.vue';
import type { EnemyClanRef } from '../../../../interfaces';
import { useStore } from '../../../../middlewares/store';
import { searchClans, closeShadowWarManagement, updateShadowWarClan } from '../../../../middlewares/services';
import { useHistorySWFormation } from '../../../composables/useHistorySWFormation';

const route  = useRoute();
const router = useRouter();
const store  = useStore();

const currentShadowWar      = computed(() => store.admin.currentShadowWar);
const loading               = ref(true);
const error                 = ref(false);
const saving                = ref(false);
const showMembersModal      = ref(false);
const showMatchDetailsModal = ref(false);
const selectedMatch         = ref<Match | null>(null);
const selectedResult        = ref('');
const showCtx               = ref(false);
const ctxPos                = ref({ top: 0, left: 0 });
const showCreateClanModal   = ref(false);
const editEnemyClanName     = ref('');
const confirmDelete         = ref(false);
const editing               = ref(false);
const editDate              = ref('');
const editEnemyClan         = ref('');
const showAttendanceModal   = ref(false);

// Edición del resultado
const editingResult   = ref(false);
const editResultValue = ref('');

// Edición de formación por categoría
const {
  expandedCategories, formationEditCats, formationEditBuffer, clanMembers, showMemberPicker,
  toggleCategory, setResult,
  assignedMemberIds, assignedMemberDetails,
  openSlotSelection, handleMemberSelected, handleMemberUnassigned, unassignSlot,
  dragSource, dragOverKey, slotKey, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
} = useHistorySWFormation(currentShadowWar, saving);

const shadowWarResults = [
  { value: 'victory', text: 'Victoria' },
  { value: 'defeat',  text: 'Derrota'  },
  { value: 'draw',    text: 'Empate'   },
  { value: 'pending', text: 'Pendiente'},
];

const resultLabel       = computed(() => shadowWarResults.find(r => r.value === selectedResult.value)?.text ?? '');
const confirmedIdsArray = computed(() => [...new Set((currentShadowWar.value?.confirmed ?? []).map((c: any) => String(c?._id ?? c)))]);
const declinedIdsArray  = computed(() => (currentShadowWar.value?.declined ?? []).map((c: any) => String(c?._id ?? c)));
const displayBattle     = computed(() => currentShadowWar.value?.battle);

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

async function openEdit() {
  const sw = currentShadowWar.value;
  editDate.value      = sw?.date ? new Date(sw.date).toISOString().slice(0, 10) : '';
  editEnemyClan.value = sw?.enemyClan?._id ?? '';
  showCtx.value       = false;
  editing.value       = true;
}

function cancelEdit() {
  editing.value       = false;
  confirmDelete.value = false;
}

function openEditResult() {
  editResultValue.value = selectedResult.value;
  editingResult.value   = true;
}

function cancelEditResult() {
  editingResult.value = false;
}

async function saveResult() {
  if (!currentShadowWar.value?._id) return;
  saving.value = true;
  try {
    await updateShadowWarClan(currentShadowWar.value._id, {
      result:      editResultValue.value,
      characterId: store.currentCharacter,
    });
    await store.handleGetShadowWar(currentShadowWar.value._id);
    editingResult.value = false;
  } finally {
    saving.value = false;
  }
}

function openAttendance() {
  showCtx.value             = false;
  showAttendanceModal.value = true;
}

async function saveEdit() {
  if (!currentShadowWar.value?._id) return;
  saving.value = true;
  try {
    const payload: any = {
      date:        editDate.value || undefined,
      enemyClan:   editEnemyClan.value || null,
      characterId: store.currentCharacter,
    };
    await updateShadowWarClan(currentShadowWar.value._id, payload);
    await store.handleGetShadowWar(currentShadowWar.value._id);
    editing.value = false;
  } finally {
    saving.value = false;
  }
}

async function toggleCompleted() {
  if (!currentShadowWar.value?._id) return;
  saving.value  = true;
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
    await closeShadowWarManagement(currentShadowWar.value._id, store.currentCharacter ?? undefined);
    store.admin.history = (store.admin.history ?? []).filter((w: any) => w._id !== currentShadowWar.value!._id);
    if (store.currentUser.shadowWarData?._id === currentShadowWar.value._id) {
      store.currentUser.shadowWarData = null;
    }
    router.push('/management/history');
  } finally {
    saving.value = false;
  }
}

function handleClanCreated(created: EnemyClanRef, requestedName: string) {
  editEnemyClan.value       = created._id;
  editEnemyClanName.value   = requestedName;
  showCreateClanModal.value = false;
}

function closeMembersModal()      { showMembersModal.value = false; }
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
