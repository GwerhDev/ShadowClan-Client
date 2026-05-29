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

      <!-- Edit mode: fields row -->
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

      <!-- Stats -->
      <div class="detail-stats">
        <div class="stat-card">
          <span class="stat-label">Resultado</span>
          <select v-if="editing" class="result-select" v-model="selectedResult">
            <option v-for="opt in shadowWarResults" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
          </select>
          <span v-else :class="['result-chip', `result-${selectedResult}`]">{{ resultLabel }}</span>
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

      <!-- Battles – EDIT mode -->
      <div v-if="editing && editBattle" class="battles-grid">
        <div v-for="(catMatches, cat) in editBattle" :key="cat" class="battle-section">
          <h5 class="battle-title">Batalla {{ translateBattle(String(cat)) }}</h5>
          <div class="matches-list">
            <div v-for="(match, mIdx) in (catMatches as any[])" :key="mIdx" class="match-edit-card">

              <div class="match-edit-header">
                <span class="match-label">Partida {{ mIdx + 1 }}</span>
                <select v-model="match.result" class="match-result-select">
                  <option v-for="opt in matchResults" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
                </select>
              </div>

              <div v-for="grp in ['group1', 'group2'] as const" :key="grp" class="group-edit">
                <span class="group-label">{{ grp === 'group1' ? 'Grupo 1' : 'Grupo 2' }}</span>
                <div class="group-chars">
                  <span
                    v-for="(char, cIdx) in match[grp].character"
                    :key="cIdx"
                    class="char-chip"
                  >
                    {{ char?.name ?? '—' }}
                    <button class="char-chip-remove" @click.stop="removeParticipant(String(cat), mIdx, grp, cIdx)">
                      <i class="fas fa-times"></i>
                    </button>
                  </span>
                  <button class="add-char-btn" @click="openMemberPicker(String(cat), mIdx, grp)" title="Agregar participante">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- Battles – READ mode -->
      <div v-else class="battles-grid">
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
      v-if="showMatchDetailsModal && !editing"
      :match="selectedMatch"
      @close="closeMatchDetailsModal"
    />
    <MemberSelectionModal
      v-if="showMemberPicker"
      :characters="clanMembers"
      :assigned-member-ids="assignedIdsForPicker"
      @close="showMemberPicker = false"
      @character-selected="handleMemberSelected"
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
import MemberSelectionModal from '../ShadowWarManagement/MemberSelectionModal.vue';
import SearchSelector from '../../Selectors/SearchSelector.vue';
import { useStore } from '../../../../middlewares/store';
import { searchClans, closeShadowWarManagement, updateShadowWarClan, getClanMembers } from '../../../../middlewares/services';

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
const confirmDelete         = ref(false);
const editing               = ref(false);
const editDate              = ref('');
const editEnemyClan         = ref('');
const editBattle            = ref<any>(null);
const clanMembers           = ref<any[]>([]);
const showMemberPicker      = ref(false);
const memberPickerCtx       = ref<{ cat: string; matchIdx: number; group: 'group1'|'group2' } | null>(null);

const shadowWarResults = [
  { value: 'victory', text: 'Victoria' },
  { value: 'defeat',  text: 'Derrota'  },
  { value: 'draw',    text: 'Empate'   },
  { value: 'pending', text: 'Pendiente'},
];

const matchResults = [
  { value: 'victory', text: 'Victoria' },
  { value: 'defeat',  text: 'Derrota'  },
  { value: 'draw',    text: 'Empate'   },
  { value: 'pending', text: 'Pendiente'},
];

const resultLabel           = computed(() => shadowWarResults.find(r => r.value === selectedResult.value)?.text ?? '');
const confirmedMembersCount = computed(() => currentShadowWar.value?.confirmed?.length ?? 0);

const formattedDateDisplay = computed(() => {
  const d = currentShadowWar.value?.date;
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
});

const assignedIdsForPicker = computed(() => {
  if (!editBattle.value || !memberPickerCtx.value) return [];
  const { cat, matchIdx } = memberPickerCtx.value;
  const m = editBattle.value[cat]?.[matchIdx];
  if (!m) return [];
  return [
    ...(m.group1.character ?? []).map((c: any) => c?._id ?? c),
    ...(m.group2.character ?? []).map((c: any) => c?._id ?? c),
  ].filter(Boolean);
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
  editBattle.value    = JSON.parse(JSON.stringify(sw?.battle ?? {}));
  showCtx.value = false;

  if ((sw as any)?.clan) {
    try {
      const data = await getClanMembers((sw as any).clan);
      clanMembers.value = [
        ...(data.leader  ? [data.leader]  : []),
        ...(data.officer ?? []),
        ...(data.member  ?? []),
      ];
    } catch { clanMembers.value = []; }
  }

  editing.value = true;
}

function cancelEdit() {
  editing.value  = false;
  editBattle.value = null;
  confirmDelete.value = false;
}

function removeParticipant(cat: string, matchIdx: number, group: 'group1'|'group2', charIdx: number) {
  editBattle.value[cat][matchIdx][group].character.splice(charIdx, 1);
}

function openMemberPicker(cat: string, matchIdx: number, group: 'group1'|'group2') {
  memberPickerCtx.value = { cat, matchIdx, group };
  showMemberPicker.value = true;
}

function handleMemberSelected(character: any) {
  if (!memberPickerCtx.value) return;
  const { cat, matchIdx, group } = memberPickerCtx.value;
  const chars: any[] = editBattle.value[cat][matchIdx][group].character;
  const id = character._id ?? character;
  if (!chars.find((c: any) => (c?._id ?? c) === id)) {
    chars.push(character);
  }
  showMemberPicker.value = false;
}

async function saveEdit() {
  if (!currentShadowWar.value?._id) return;
  saving.value = true;
  try {
    // Convert populated objects to IDs for the battle
    const cleanBattle = JSON.parse(JSON.stringify(editBattle.value));
    for (const cat of Object.keys(cleanBattle)) {
      for (const match of cleanBattle[cat]) {
        match.group1.character = (match.group1.character ?? []).filter(Boolean).map((c: any) => c?._id ?? c);
        match.group2.character = (match.group2.character ?? []).filter(Boolean).map((c: any) => c?._id ?? c);
      }
    }
    await updateShadowWarClan(currentShadowWar.value._id, {
      date:      editDate.value || undefined,
      enemyClan: editEnemyClan.value || null,
      result:    selectedResult.value,
      battle:    cleanBattle,
      characterId: store.currentCharacter,
    });
    await store.handleGetShadowWar(currentShadowWar.value._id);
    editing.value    = false;
    editBattle.value = null;
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
