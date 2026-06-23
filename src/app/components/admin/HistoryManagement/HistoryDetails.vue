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
        <div class="stat-card">
          <span class="stat-label">Puntaje</span>
          <div class="stat-value-row">
            <span class="score-win">{{ scoreWins }}</span>
            <span class="score-sep">-</span>
            <span class="score-lose">{{ scoreLosses }}</span>
          </div>
          <span class="score-total">/ {{ scorePoints.total }} pts</span>
        </div>
      </div>

      <!-- View toggle -->
      <div class="view-toggle">
        <button :class="['toggle-btn', { 'toggle-btn--active': viewMode === 'final' }]" @click="viewMode = 'final'">Final</button>
        <button :class="['toggle-btn', { 'toggle-btn--active': viewMode === 'planned' }]" @click="viewMode = 'planned'">Planificada</button>
      </div>

      <!-- Battles -->
      <div class="battles-section">
        <div v-for="(matches, battleType) in displayBattle" :key="battleType" class="battle-card">
          <div class="battle-card-header" @click="toggleCategory(String(battleType))">
            <div class="battle-card-meta">
              <i class="fas fa-swords"></i>
              <span class="battle-card-name">Batalla {{ translateBattle(String(battleType)) }}</span>
              <span class="battle-card-count">{{ matchScoreSummary(String(battleType), matches as any[]) }}</span>
            </div>
            <div class="battle-card-actions" @click.stop>
              <i v-if="saving && formationEditCats.includes(String(battleType))" class="fas fa-circle-notch fa-spin battle-saving-icon"></i>
              <button class="btn-expand" @click="toggleCategory(String(battleType))">
                <i :class="expandedCategories.includes(String(battleType)) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
              </button>
            </div>
          </div>
          <div v-if="expandedCategories.includes(String(battleType))" class="battle-card-body">
            <div
              v-for="(match, mIdx) in (formationEditCats.includes(String(battleType))
                ? formationEditBuffer[String(battleType)]
                : (matches as any[]))"
              :key="mIdx"
              class="battle-match"
            >
              <h5 class="match-title">
                Partida {{ mIdx + 1 }}
                <div class="match-title-actions">
                  <span
                    v-if="viewMode === 'planned' && absenceCount(match) > 0"
                    class="absence-badge"
                  >
                    <i class="fas fa-user-slash"></i> {{ absenceCount(match) }}
                  </span>
                  <select
                    v-if="formationEditCats.includes(String(battleType))"
                    v-model="formationEditBuffer[String(battleType)][mIdx].result"
                    class="match-result-select"
                    @change="autoSave(String(battleType))"
                  >
                    <option v-for="opt in matchResults" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
                  </select>
                  <span v-else :class="['result-chip', `result-${match.result}`]">{{ translateResult(match.result) }}</span>
                </div>
              </h5>
              <div class="match-groups">
                <div v-for="grp in (['group1', 'group2'] as const)" :key="grp" class="group">
                  <label><h5>{{ grp === 'group1' ? 'Grupo 1' : 'Grupo 2' }}</h5></label>
                  <div class="character-cards-grid">
                    <div
                      v-for="n in 4"
                      :key="n"
                      class="drag-slot"
                      :class="{
                        'is-dragging': dragSource && slotKey(dragSource) === slotKey({ cat: String(battleType), matchIdx: mIdx, group: grp, memberIndex: n - 1 }),
                        'drag-over':   dragOverKey === slotKey({ cat: String(battleType), matchIdx: mIdx, group: grp, memberIndex: n - 1 })
                      }"
                      :draggable="formationEditCats.includes(String(battleType)) && !!formationEditBuffer[String(battleType)]?.[mIdx]?.[grp]?.character?.[n - 1]"
                      @dragstart="onDragStart($event, { cat: String(battleType), matchIdx: mIdx, group: grp, memberIndex: n - 1 })"
                      @dragover.prevent="onDragOver($event, { cat: String(battleType), matchIdx: mIdx, group: grp, memberIndex: n - 1 })"
                      @dragleave="onDragLeave"
                      @drop="onDrop({ cat: String(battleType), matchIdx: mIdx, group: grp, memberIndex: n - 1 })"
                      @dragend="onDragEnd"
                    >
                      <ShadowWarMemberCard
                        :character="formationEditCats.includes(String(battleType))
                          ? formationEditBuffer[String(battleType)][mIdx][grp].character[n - 1]
                          : match[grp].character[n - 1]"
                        :show-unassign-button="formationEditCats.includes(String(battleType)) && !!formationEditBuffer[String(battleType)][mIdx][grp].character[n - 1]"
                        :readonly="!formationEditCats.includes(String(battleType))"
                        :confirmed-ids="confirmedIdsArray"
                        @click="formationEditCats.includes(String(battleType))
                          ? openSlotSelection(String(battleType), mIdx, grp, n - 1)
                          : undefined"
                        @unassign="unassignSlot(String(battleType), mIdx, grp, n - 1)"
                      />
                    </div>
                  </div>
                </div>
              </div>
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
      @character-selected="handleMemberSelected($event)"
    />

    <!-- Attendance modal -->
    <Teleport to="body">
      <div v-if="showAttendanceModal" class="attendance-overlay" @click.self="showAttendanceModal = false">
        <div class="attendance-modal">
          <div class="attendance-modal-header">
            <span class="attendance-modal-title">Asistencia</span>
            <button class="ctx-cancel-btn" @click="showAttendanceModal = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="attendance-modal-body">
            <div v-if="attendanceMembers.length === 0" class="attendance-empty">
              <i class="fas fa-users-slash"></i>
              <span>No hay miembros en la nómina final.</span>
            </div>
            <div v-for="member in attendanceMembers" :key="member._id" class="attendance-row">
              <ClassImage :current-class="member.currentClass" />
              <div class="attendance-member-info">
                <span class="attendance-member-name">{{ member.name }}</span>
                <span class="attendance-member-meta">{{ getClassName(member.currentClass) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>

  <!-- Create enemy clan modal -->
  <Teleport to="body">
    <div v-if="showCreateClanModal" class="create-clan-overlay" @click.self="showCreateClanModal = false; createClanError = ''">
      <div class="create-clan-modal">
        <h4 class="create-clan-title">Crear clan enemigo</h4>
        <input
          class="create-clan-input"
          type="text"
          v-model="newClanName"
          placeholder="Nombre del clan"
          @keydown.enter="handleCreateClan"
          @keydown.esc="showCreateClanModal = false"
        />
        <p v-if="createClanError" class="create-clan-error">{{ createClanError }}</p>
        <div class="create-clan-actions">
          <button class="btn-create-clan" :disabled="!newClanName.trim() || creatingClan" @click="handleCreateClan">
            <i class="fas fa-check"></i> Crear
          </button>
          <button class="btn-cancel-modal" @click="showCreateClanModal = false; createClanError = ''">
            <i class="fas fa-times"></i> Cancelar
          </button>
        </div>
      </div>
    </div>
  </Teleport>

</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Match } from '../../../../interfaces';
import { translateBattle, translateResult } from '../../../../helpers/lists';
import MatchDetailsModal from './MatchDetailsModal.vue';
import ConfirmedMembersModal from './ConfirmedMembersModal.vue';
import MemberSelectionModal from '../ShadowWarManagement/MemberSelectionModal.vue';
import ShadowWarMemberCard from '../ShadowWarManagement/ShadowWarMemberCard.vue';
import SearchSelector from '../../Selectors/SearchSelector.vue';
import ClassImage from '../../common/ClassImage.vue';
import { useStore } from '../../../../middlewares/store';
import { searchClans, closeShadowWarManagement, updateShadowWarClan, getClanMembers, createEnemyClan } from '../../../../middlewares/services';
import { classes } from '../../../../middlewares/misc/const';

const getClassName = (cls: string | undefined) => classes.find(c => c.value === cls)?.name ?? (cls ?? '');

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
const newClanName           = ref('');
const creatingClan          = ref(false);
const createClanError       = ref('');
const editEnemyClanName     = ref('');
const confirmDelete         = ref(false);
const editing    = ref(false);
const viewMode   = ref<'planned' | 'final'>('final');
const editDate   = ref('');
const editEnemyClan = ref('');
const clanMembers   = ref<any[]>([]);
const showMemberPicker      = ref(false);
const expandedCategories    = ref<string[]>([] as string[]);

// Attendance modal
const showAttendanceModal = ref(false);

// Result editing
const editingResult  = ref(false);
const editResultValue = ref('');

// Formation editing — per category
const formationEditCats   = ref<string[]>([]);
const formationEditBuffer = ref<Record<string, any>>({});
const selectionContext    = ref<{ cat: string; matchIdx: number; group: 'group1'|'group2'; memberIndex: number } | null>(null);

// Drag and drop
interface SlotRef { cat: string; matchIdx: number; group: 'group1'|'group2'; memberIndex: number; }
const dragSource  = ref<SlotRef | null>(null);
const dragOverKey = ref<string | null>(null);
function slotKey(s: SlotRef) { return `${s.cat}-${s.matchIdx}-${s.group}-${s.memberIndex}`; }
function getDragChar(s: SlotRef) { return formationEditBuffer.value[s.cat]?.[s.matchIdx]?.[s.group]?.character?.[s.memberIndex]; }
function setDragChar(s: SlotRef, char: any) { formationEditBuffer.value[s.cat][s.matchIdx][s.group].character[s.memberIndex] = char; }
function onDragStart(e: DragEvent, slot: SlotRef) {
  if (!getDragChar(slot)) { e.preventDefault(); return; }
  dragSource.value = slot;
  e.dataTransfer!.effectAllowed = 'move';
}
function onDragOver(e: DragEvent, slot: SlotRef) {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
  dragOverKey.value = slotKey(slot);
}
function onDragLeave() { dragOverKey.value = null; }
async function onDrop(slot: SlotRef) {
  dragOverKey.value = null;
  if (!dragSource.value) return;
  const src = dragSource.value;
  dragSource.value = null;
  if (slotKey(src) === slotKey(slot)) return;
  const srcChar = getDragChar(src);
  const tgtChar = getDragChar(slot);
  setDragChar(src, tgtChar);
  setDragChar(slot, srcChar);
  await autoSave(slot.cat);
  if (src.cat !== slot.cat) await autoSave(src.cat);
}
function onDragEnd() { dragSource.value = null; dragOverKey.value = null; }

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

const resultLabel    = computed(() => shadowWarResults.find(r => r.value === selectedResult.value)?.text ?? '');
const confirmedIds   = computed(() => new Set((currentShadowWar.value?.confirmed ?? []).map((c: any) => String(c?._id ?? c))));
const confirmedIdsArray = computed(() => [...confirmedIds.value]);
const hasFinalBattle = computed(() => {
  const fb = (currentShadowWar.value as any)?.finalBattle;
  if (!fb) return false;
  return Object.values(fb).some((arr: any) => arr?.length > 0);
});

const displayBattle = computed(() => {
  if (viewMode.value === 'final' && hasFinalBattle.value) return (currentShadowWar.value as any).finalBattle;
  return currentShadowWar.value?.battle;
});

const attendanceMembers = computed(() => {
  const sw = currentShadowWar.value as any;
  const battle = sw?.finalBattle && Object.values(sw.finalBattle).some((a: any) => a?.length > 0)
    ? sw.finalBattle
    : sw?.battle;
  if (!battle) return [];
  const seen = new Set<string>();
  const members: any[] = [];
  for (const matches of Object.values(battle) as any[][]) {
    for (const match of matches) {
      for (const grp of ['group1', 'group2']) {
        for (const char of match[grp]?.character ?? []) {
          if (!char) continue;
          const id = String(char._id ?? char);
          if (!seen.has(id)) { seen.add(id); members.push(char); }
        }
      }
    }
  }
  return members;
});

const scorePoints = computed(() => {
  const battle = displayBattle.value;
  if (!battle) return { won: 0, lost: 0, total: 0 };
  let won = 0, lost = 0, total = 0;
  for (const [cat, matches] of Object.entries(battle) as [string, any[]][]) {
    const pts = POINTS_PER_MATCH[cat] ?? 1;
    for (const m of matches) {
      total += pts;
      if (m.result === 'victory')     won  += pts;
      else if (m.result === 'defeat') lost += pts;
    }
  }
  return { won, lost, total };
});
const scoreWins   = computed(() => scorePoints.value.won);
const scoreLosses = computed(() => scorePoints.value.lost);

const formattedDateDisplay = computed(() => {
  const d = currentShadowWar.value?.date;
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
});

const assignedIdsForPicker = computed(() => {
  if (!selectionContext.value) return [];
  const { cat, matchIdx } = selectionContext.value;
  const m = formationEditBuffer.value[cat]?.[matchIdx];
  if (!m) return [];
  return [
    ...(m.group1.character ?? []).map((c: any) => c?._id ?? c),
    ...(m.group2.character ?? []).map((c: any) => c?._id ?? c),
  ].filter(Boolean);
});

watch(currentShadowWar, (val) => {
  if (val) selectedResult.value = val.result;
}, { immediate: true });

watch(viewMode, () => {
  // Cancel any open formation edits when switching tabs
  formationEditCats.value = [];
  formationEditBuffer.value = {};
});

function toggleCategory(cat: string) {
  const idx = expandedCategories.value.indexOf(cat);
  if (idx >= 0) {
    expandedCategories.value.splice(idx, 1);
    cancelFormationEdit(cat);
  } else {
    expandedCategories.value.push(cat);
    if (viewMode.value === 'final') openFormationEdit(cat);
  }
}

const POINTS_PER_MATCH: Record<string, number> = {
  exalted: 8,
  eminent: 4,
  famed:   2,
  proud:   1,
};

function matchScoreSummary(cat: string, matches: any[]): string {
  const pts    = POINTS_PER_MATCH[cat] ?? 1;
  const total  = matches.length * pts;
  const earned = matches.filter(m => m.result === 'victory').length * pts;
  return `${earned} / ${total} pts`;
}

function toggleCtx(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  ctxPos.value = { top: rect.bottom + 4, left: rect.right };
  showCtx.value = !showCtx.value;
}

async function loadClanMembers() {
  if (clanMembers.value.length) return;
  const sw = currentShadowWar.value;
  if (!(sw as any)?.clan) return;
  try {
    const data = await getClanMembers((sw as any).clan);
    clanMembers.value = [
      ...(data.leader  ? [data.leader]  : []),
      ...(data.officer ?? []),
      ...(data.member  ?? []),
    ];
  } catch { clanMembers.value = []; }
}

async function openEdit() {
  const sw = currentShadowWar.value;
  editDate.value      = sw?.date ? new Date(sw.date).toISOString().slice(0, 10) : '';
  editEnemyClan.value = sw?.enemyClan?._id ?? '';
  viewMode.value      = 'final';
  showCtx.value       = false;
  editing.value       = true;
}

function cancelEdit() {
  editing.value       = false;
  confirmDelete.value = false;
}

function absenceCount(match: any): number {
  const chars = [...(match.group1?.character ?? []), ...(match.group2?.character ?? [])];
  return chars.filter(c => c && !confirmedIds.value.has(String(c?._id ?? c))).length;
}

// Result editing
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

// Formation editing
async function openFormationEdit(cat: string) {
  if (formationEditCats.value.includes(cat)) return;
  const sw = currentShadowWar.value as any;
  const source = viewMode.value === 'final' && hasFinalBattle.value
    ? (sw?.finalBattle ?? sw?.battle)
    : sw?.battle;
  formationEditBuffer.value[cat] = JSON.parse(JSON.stringify(source?.[cat] ?? []));
  formationEditCats.value.push(cat);
  if (!expandedCategories.value.includes(cat)) expandedCategories.value.push(cat);
  await loadClanMembers();
}

function cancelFormationEdit(cat: string) {
  formationEditCats.value = formationEditCats.value.filter(c => c !== cat);
  delete formationEditBuffer.value[cat];
}

function cleanMatch(m: any) {
  return {
    result: m.result,
    group1: { character: (m.group1?.character ?? []).filter(Boolean).map((c: any) => c?._id ?? c) },
    group2: { character: (m.group2?.character ?? []).filter(Boolean).map((c: any) => c?._id ?? c) },
  };
}

async function saveFormationEdit(cat: string) {
  if (!currentShadowWar.value?._id) return;
  saving.value = true;
  try {
    const sw     = currentShadowWar.value as any;
    const source = viewMode.value === 'final' && hasFinalBattle.value ? 'finalBattle' : 'battle';
    const raw    = sw[source] ?? sw.battle ?? {};
    const fullBattle: Record<string, any[]> = {};
    for (const c of Object.keys(raw)) {
      fullBattle[c] = c === cat
        ? (formationEditBuffer.value[cat] ?? []).map(cleanMatch)
        : (raw[c] ?? []).map(cleanMatch);
    }
    await updateShadowWarClan(currentShadowWar.value._id, {
      [source]:    fullBattle,
      characterId: store.currentCharacter,
    });
    await store.handleGetShadowWar(currentShadowWar.value._id);
    // Refresh buffer from fresh data (keep edit mode open)
    const fresh = currentShadowWar.value as any;
    const freshSource = viewMode.value === 'final' && hasFinalBattle.value
      ? (fresh?.finalBattle ?? fresh?.battle)
      : fresh?.battle;
    if (freshSource?.[cat]) formationEditBuffer.value[cat] = JSON.parse(JSON.stringify(freshSource[cat]));
  } finally {
    saving.value = false;
  }
}

async function autoSave(cat: string) {
  await saveFormationEdit(cat);
}

function openSlotSelection(cat: string, matchIdx: number, group: 'group1'|'group2', memberIndex: number) {
  selectionContext.value = { cat, matchIdx, group, memberIndex };
  showMemberPicker.value = true;
}

async function handleMemberSelected(character: any) {
  if (!selectionContext.value) return;
  const { cat, matchIdx, group, memberIndex } = selectionContext.value;
  formationEditBuffer.value[cat][matchIdx][group].character[memberIndex] = character;
  showMemberPicker.value = false;
  selectionContext.value = null;
  await autoSave(cat);
}

async function unassignSlot(cat: string, matchIdx: number, group: 'group1'|'group2', memberIndex: number) {
  formationEditBuffer.value[cat][matchIdx][group].character[memberIndex] = undefined;
  await autoSave(cat);
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
    await closeShadowWarManagement(currentShadowWar.value._id, (store as any).currentCharacter);
    store.admin.history = (store.admin.history ?? []).filter((w: any) => w._id !== currentShadowWar.value!._id);
    if (store.currentUser.shadowWarData?._id === currentShadowWar.value._id) {
      store.currentUser.shadowWarData = null;
    }
    router.push('/management/history');
  } finally {
    saving.value = false;
  }
}

async function handleCreateClan() {
  if (!newClanName.value.trim()) return;
  creatingClan.value    = true;
  createClanError.value = '';
  try {
    const name    = newClanName.value.trim();
    const created = await createEnemyClan(name, (store as any).currentCharacter);
    editEnemyClan.value       = created._id;
    editEnemyClanName.value   = name;
    showCreateClanModal.value = false;
    newClanName.value         = '';
  } catch (err: any) {
    createClanError.value = err?.response?.data?.message ?? 'Error al crear el clan.';
  } finally {
    creatingClan.value = false;
  }
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

<style lang="scss">
.create-clan-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.create-clan-modal {
  background: var(--color-primary-bg);
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.create-clan-title {
  margin: 0;
  font-size: .85rem;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: rgba(255, 255, 255, .7);
}
.create-clan-input {
  width: 100%;
  height: 38px;
  padding: 0 .75rem;
  background: rgba(255, 255, 255, .04);
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 8px;
  color: var(--color-app-white);
  font-family: 'Cinzel', serif;
  font-size: .9rem;
  &:focus { outline: none; border-color: rgba(227, 210, 168, .4); }
  &::placeholder { color: rgba(255, 255, 255, .25); }
}
.create-clan-error { margin: 0; font-size: .78rem; color: #f87171; }
.create-clan-actions { display: flex; gap: .5rem; justify-content: flex-end; }
.btn-create-clan {
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .3rem .85rem; height: 36px;
  font-family: 'Cinzel', serif; font-size: .72rem;
  background: transparent; border: 1px solid rgba(76, 175, 80, .4);
  color: #81c784; border-radius: 6px; cursor: pointer;
  &:hover:not(:disabled) { background: rgba(76, 175, 80, .1); border-color: rgba(76, 175, 80, .7); }
  &:disabled { opacity: .4; cursor: not-allowed; }
}
.btn-cancel-modal {
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .3rem .85rem; height: 36px;
  font-family: 'Cinzel', serif; font-size: .72rem;
  background: transparent; border: 1px solid rgba(255, 255, 255, .12);
  color: rgba(255, 255, 255, .5); border-radius: 6px; cursor: pointer;
  &:hover { border-color: rgba(255, 255, 255, .3); color: rgba(255, 255, 255, .8); }
}

.attendance-modal .respond-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, .1);
  color: rgba(255, 255, 255, .3);
  font-size: .72rem;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;

  &:disabled { opacity: .4; cursor: not-allowed; }

  &.respond-btn--confirm {
    &:hover:not(:disabled), &.active {
      background: rgba(76, 175, 80, .12);
      border-color: rgba(129, 199, 132, .55);
      color: #81c784;
    }
  }
  &.respond-btn--pending {
    &:hover:not(:disabled), &.active {
      background: rgba(255, 193, 7, .1);
      border-color: rgba(255, 193, 7, .45);
      color: rgba(255, 193, 7, .9);
    }
  }
  &.respond-btn--decline {
    &:hover:not(:disabled), &.active {
      background: rgba(229, 115, 115, .1);
      border-color: rgba(229, 115, 115, .5);
      color: rgba(229, 115, 115, .9);
    }
  }
}
</style>
