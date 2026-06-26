<script setup lang="ts">
import { ref, onMounted, Ref, computed, watch } from 'vue';
import { updateShadowWarClan, searchClans, getClanMembers, createShadowWarManagement, closeShadowWarManagement, completeShadowWarManagement, createEnemyClan, saveClanRoster, autoAssignRoster, respondToShadowWar } from '../../../../middlewares/services';
import CustomModal from '../../Modals/CustomModal.vue';
import { Character, Match } from '../../../../interfaces';
import ShadowWarMemberCard from './ShadowWarMemberCard.vue';
import MemberSelectionModal from './MemberSelectionModal.vue';
import SearchSelector from '../../Selectors/SearchSelector.vue';
import ShareModal from './ShareModal.vue';
import FormacionesModal from './FormacionesModal.vue';
import { useStore } from '../../../../middlewares/store';

const emit = defineEmits(['publish']);
const showShareModal      = ref(false);
const showFormacionesModal = ref(false);
const store: any = useStore();

const showConfirmModal  = ref(false);
const pendingClanName   = ref('');
const createTarget      = ref<'new' | 'edit'>('new');
const creatingClan      = ref(false);
const createClanError   = ref('');
const lastCreated       = ref<{ _id: string; name: string } | null>(null);

function handleOpenConfirm(query: string, target: 'new' | 'edit') {
  pendingClanName.value = query;
  createTarget.value    = target;
  createClanError.value = '';
  showConfirmModal.value = true;
}

async function handleConfirmCreate() {
  if (!pendingClanName.value.trim()) return;
  creatingClan.value    = true;
  createClanError.value = '';
  try {
    const created = await createEnemyClan(pendingClanName.value.trim(), store.currentCharacter);
    lastCreated.value = { _id: created._id, name: created.name };
    if (createTarget.value === 'new') {
      newEnemyClan.value = created._id;
    } else {
      enemyClan.value = created._id;
    }
    showConfirmModal.value = false;
    pendingClanName.value  = '';
  } catch (err: any) {
    createClanError.value = err?.response?.data?.message ?? 'Error al crear el clan.';
  } finally {
    creatingClan.value = false;
  }
}

const clanMembers: Ref<Character[]> = ref([]);
const shadowWarData = computed(() => store.currentUser.shadowWarData);

const chars  = computed(() => store.currentUser.userData?.character ?? []);
const active = computed(() => (chars.value as any[]).find((c: any) => c._id === store.currentCharacter) ?? chars.value[0] ?? null);
const clanId = computed(() => active.value?.clan?._id ?? active.value?.clan ?? null);

interface AlignmentSlot { name: string; data: any }
interface SavedAlignments { last: any | null; custom: AlignmentSlot[] }
const savedAlignments     = ref<SavedAlignments>({ last: null, custom: [] });
const savingAlignment     = ref(false);
const autoAssigning       = ref(false);
const showSaveCustomModal = ref(false);
const customAlignmentName = ref('');
const customOverwriteIdx  = ref<number | null>(null);

const shadowWarId  = ref<string | null>(null);
const enemyClan    = ref('');   // for the active instance (read-only bar + edit mode)
const newEnemyClan = ref('');  // for the create panel
const loading      = ref(true);
const saving       = ref(false);
const newDate      = ref('');
const editing      = ref(false); // edit mode for the active instance panel
const editDate     = ref('');    // date input value in edit mode

const toInputDate = (isoStr: string): string => {
  if (!isoStr) return '';
  return new Date(isoStr).toISOString().slice(0, 10);
};

const showContextMenu = ref(false);
const showMemberSelectionModal = ref(false);
const currentSelectionContext = ref<{
  categoryName: keyof typeof battleCategories.value;
  group: 'group1' | 'group2';
  matchIndex: number;
  memberIndex: number;
} | null>(null);

// Collapsible battle categories
const expandedCategories = ref<string[]>([]);

function toggleCategory(cat: string) {
  const idx = expandedCategories.value.indexOf(cat);
  if (idx !== -1) expandedCategories.value.splice(idx, 1);
  else             expandedCategories.value.push(cat);
}

function categoryStats(cat: string): { assigned: number; total: number } {
  const matches: any[] = (battleCategories.value as any)[cat] ?? [];
  let assigned = 0;
  let total    = 0;
  for (const match of matches) {
    for (const grp of ['group1', 'group2'] as const) {
      const chars: any[] = match[grp]?.character ?? [];
      assigned += chars.filter(Boolean).length;
      total    += chars.length;
    }
  }
  return { assigned, total };
}

const battleCategoryTranslations: Record<string, string> = {
  exalted: 'sublime',
  eminent: 'eminente',
  famed: 'célebre',
  proud: 'imponente',
};

const battleCategories = ref<{
  exalted: Match[];
  eminent: Match[];
  famed: Match[];
  proud: Match[];
}>({
  exalted: Array(3).fill(null).map(() => ({ group1: { character: Array(4).fill(undefined) }, group2: { character: Array(4).fill(undefined) }, result: 'pending' })),
  eminent: Array(3).fill(null).map(() => ({ group1: { character: Array(4).fill(undefined) }, group2: { character: Array(4).fill(undefined) }, result: 'pending' })),
  famed:   Array(3).fill(null).map(() => ({ group1: { character: Array(4).fill(undefined) }, group2: { character: Array(4).fill(undefined) }, result: 'pending' })),
  proud:   Array(3).fill(null).map(() => ({ group1: { character: Array(4).fill(undefined) }, group2: { character: Array(4).fill(undefined) }, result: 'pending' })),
});

const translatedCategoryName = computed(() => (categoryName: string) => {
  return battleCategoryTranslations[categoryName] || categoryName;
});

const confirmedIds = computed<string[]>(() => {
  const confirmed = shadowWarData.value?.confirmed ?? [];
  return confirmed.map((c: any) => (typeof c === 'string' ? c : c._id));
});

const declinedIds = computed<string[]>(() => {
  const declined = shadowWarData.value?.declined ?? [];
  return declined.map((c: any) => (typeof c === 'string' ? c : c._id));
});

const respondingCharId = ref<string | null>(null);

async function handleRespond(action: 'confirm' | 'decline' | 'pending', characterId: string) {
  if (!shadowWarId.value || !characterId) return;
  respondingCharId.value = characterId;
  try {
    await respondToShadowWar(shadowWarId.value, characterId, action);
    await store.handleGetNextShadowWar();
  } finally {
    respondingCharId.value = null;
  }
}

const assignedMemberIds = computed(() => {
  const ids = new Set<string>();
  for (const category of Object.values(battleCategories.value)) {
    for (const match of category) {
      for (const character of match.group1.character) {
        if (character?._id) ids.add(character._id);
      }
      for (const character of match.group2.character) {
        if (character?._id) ids.add(character._id);
      }
    }
  }
  return Array.from(ids);
});

const categoryLabels: Record<string, string> = {
  exalted: 'Sublime',
  eminent: 'Eminente',
  famed: 'Célebre',
  proud: 'Imponente',
};

interface AssignedDetail {
  label: string;
  category: keyof typeof battleCategories.value;
  matchIndex: number;
  group: 'group1' | 'group2';
  memberIndex: number;
}

const assignedMemberDetails = computed(() => {
  const details: Record<string, AssignedDetail> = {};
  for (const [cat, matches] of Object.entries(battleCategories.value)) {
    for (let i = 0; i < (matches as any[]).length; i++) {
      const match = (matches as any[])[i];
      const base = (categoryLabels[cat] ?? cat) + ' · P' + (i + 1);
      match.group1.character.forEach((character: any, memberIndex: number) => {
        if (character?._id) details[character._id] = { label: base + ' · G1', category: cat as any, matchIndex: i, group: 'group1', memberIndex };
      });
      match.group2.character.forEach((character: any, memberIndex: number) => {
        if (character?._id) details[character._id] = { label: base + ' · G2', category: cat as any, matchIndex: i, group: 'group2', memberIndex };
      });
    }
  }
  return details;
});


const handleMemberUnassigned = (characterId: string) => {
  const detail = assignedMemberDetails.value[characterId];
  if (!detail) return;
  const { category, matchIndex, group, memberIndex } = detail;
  battleCategories.value[category][matchIndex][group].character[memberIndex] = undefined;
  updateShadowWarData();
};

const resetBattleCategories = () => {
  battleCategories.value = {
    exalted: Array(3).fill(null).map(() => ({ group1: { character: Array(4).fill(undefined) }, group2: { character: Array(4).fill(undefined) }, result: 'pending' })),
    eminent: Array(3).fill(null).map(() => ({ group1: { character: Array(4).fill(undefined) }, group2: { character: Array(4).fill(undefined) }, result: 'pending' })),
    famed:   Array(3).fill(null).map(() => ({ group1: { character: Array(4).fill(undefined) }, group2: { character: Array(4).fill(undefined) }, result: 'pending' })),
    proud:   Array(3).fill(null).map(() => ({ group1: { character: Array(4).fill(undefined) }, group2: { character: Array(4).fill(undefined) }, result: 'pending' })),
  };
};

const applyBattleData = (battle: any) => {
  if (!battle) return;
  const { exalted, eminent, famed, proud } = battle;
  battleCategories.value.exalted = exalted || battleCategories.value.exalted;
  battleCategories.value.eminent = eminent || battleCategories.value.eminent;
  battleCategories.value.famed   = famed   || battleCategories.value.famed;
  battleCategories.value.proud   = proud   || battleCategories.value.proud;
};

// Reflect remote changes from other officers editing the same instance
watch(shadowWarData, (newVal) => {
  if (!newVal) return;
  const incomingId = String(newVal._id ?? '');
  if (!incomingId || !shadowWarId.value || shadowWarId.value !== incomingId) return;
  applyBattleData(newVal.battle);
  if (!editing.value && newVal.enemyClan) {
    const ecId = typeof newVal.enemyClan === 'object' ? (newVal.enemyClan._id ?? '') : newVal.enemyClan;
    if (ecId) enemyClan.value = ecId;
  }
});

onMounted(async () => {
  loading.value = true;
  try {
    if (!shadowWarData.value) {
      await store.handleGetNextShadowWar();
    }

    const clanData = await (clanId.value ? getClanMembers(clanId.value) : Promise.resolve(null));

    if (clanData) {
      clanMembers.value = [
        ...(clanData.leader  ? [clanData.leader]  : []),
        ...(clanData.officer ?? []),
        ...(clanData.member  ?? []),
      ];
      if (clanData.savedShadowWarAlignments) {
        savedAlignments.value = {
          last:   clanData.savedShadowWarAlignments.last   ?? null,
          custom: clanData.savedShadowWarAlignments.custom ?? [],
        };
      }
    }

    if (shadowWarData.value) {
      shadowWarId.value = shadowWarData.value._id ?? null;
      applyBattleData(shadowWarData.value.battle);
      if (shadowWarData.value.enemyClan) {
        enemyClan.value = shadowWarData.value.enemyClan._id;
      }
      // (roster is always visible — no expanded state needed)
    }
  } finally {
    loading.value = false;
  }
});

const createInstance = async () => {
  if (!newDate.value) return;
  saving.value = true;
  try {
    const created = await createShadowWarManagement(newDate.value, newEnemyClan.value || null, store.currentCharacter);
    store.setShadowWarData(created);
    shadowWarId.value = created._id ?? null;
    newDate.value = '';
    newEnemyClan.value = '';
    if (created.enemyClan) enemyClan.value = created.enemyClan._id;
    applyBattleData(created.battle);
  } finally {
    saving.value = false;
  }
};

const closeInstance = async () => {
  if (!shadowWarId.value) return;
  saving.value = true;
  try {
    await closeShadowWarManagement(shadowWarId.value, store.currentCharacter);
    store.setShadowWarData(null);
    shadowWarId.value = null;
    enemyClan.value   = '';
    editing.value     = false;
    resetBattleCategories();
  } finally {
    saving.value = false;
  }
};

const completeInstance = async () => {
  if (!shadowWarId.value) return;
  saving.value = true;
  try {
    await completeShadowWarManagement(shadowWarId.value, store.currentCharacter);
    store.setShadowWarData(null);
    shadowWarId.value = null;
    enemyClan.value   = '';
    editing.value     = false;
    resetBattleCategories();
  } finally {
    saving.value = false;
  }
};

const openEdit = () => {
  editDate.value = shadowWarData.value ? toInputDate(shadowWarData.value.date) : '';
  editing.value  = true;
};

const cancelEdit = () => {
  // restore enemyClan to current saved value
  if (shadowWarData.value?.enemyClan) {
    enemyClan.value = shadowWarData.value.enemyClan._id;
  } else {
    enemyClan.value = '';
  }
  editing.value = false;
};

const saveEdit = async () => {
  if (!shadowWarId.value) return;
  saving.value = true;
  try {
    const formData: any = { enemyClan: enemyClan.value || null };
    if (editDate.value) formData.date = editDate.value;
    const updated = await updateShadowWarClan(shadowWarId.value, formData, store.currentCharacter);
    if (updated) store.setShadowWarData(updated);
    editing.value = false;
  } finally {
    saving.value = false;
  }
};

const toId = (c: any): string | null => {
  if (!c) return null;
  return typeof c === 'string' ? c : (c._id ?? null);
};

const updateShadowWarData = async () => {
  if (!shadowWarId.value) return;

  const battleData: any = {};
  for (const [cat, matches] of Object.entries(battleCategories.value)) {
    battleData[cat] = (matches as any[]).map(match => ({
      result: match.result,
      group1: { character: match.group1.character.map(toId) },
      group2: { character: match.group2.character.map(toId) },
    }));
  }

  const formData = {
    enemyClan: enemyClan.value || null,
    battle: battleData,
  };
  const updated = await updateShadowWarClan(shadowWarId.value, formData, store.currentCharacter);
  if (updated) store.setShadowWarData(updated);
};

const openMemberSelection = (categoryName: keyof typeof battleCategories.value, group: 'group1' | 'group2', matchIndex: number, memberIndex: number) => {
  currentSelectionContext.value = { categoryName, group, matchIndex, memberIndex };
  showMemberSelectionModal.value = true;
};

const handleMemberSelected = (selectedMember: Character) => {
  if (currentSelectionContext.value) {
    const { categoryName, group, matchIndex, memberIndex } = currentSelectionContext.value;
    battleCategories.value[categoryName][matchIndex][group].character[memberIndex] = selectedMember;
    updateShadowWarData();
  }
  showMemberSelectionModal.value = false;
};

const unassignMember = (categoryName: keyof typeof battleCategories.value, group: 'group1' | 'group2', matchIndex: number, memberIndex: number) => {
  battleCategories.value[categoryName][matchIndex][group].character[memberIndex] = undefined;
  updateShadowWarData();
};

// ── Saved alignment ──────────────────────────────────────────────────────────

function buildSWData() {
  const battleData: any = {};
  for (const [cat, matches] of Object.entries(battleCategories.value)) {
    battleData[cat] = (matches as any[]).map(match => ({
      group1: { character: match.group1.character.map(toId) },
      group2: { character: match.group2.character.map(toId) },
    }));
  }
  return battleData;
}

async function saveLastAlignment() {
  if (!clanId.value) return;
  savingAlignment.value = true;
  try {
    const data = buildSWData();
    await saveClanRoster(clanId.value, { type: 'shadow-war', slot: 'last', data });
    savedAlignments.value.last = data;
  } finally {
    savingAlignment.value = false;
  }
}

function openSaveCustomModal() {
  customAlignmentName.value = '';
  customOverwriteIdx.value  = null;
  showSaveCustomModal.value = true;
}

async function confirmSaveCustom() {
  if (!clanId.value || !customAlignmentName.value.trim()) return;
  const isFull = savedAlignments.value.custom.length >= 3;
  if (isFull && customOverwriteIdx.value === null) return;
  savingAlignment.value = true;
  try {
    const data = buildSWData();
    await saveClanRoster(clanId.value, {
      type: 'shadow-war', slot: 'custom',
      name: customAlignmentName.value.trim(),
      customIndex: isFull ? customOverwriteIdx.value : undefined,
      data,
    });
    const entry: AlignmentSlot = { name: customAlignmentName.value.trim(), data };
    if (isFull && customOverwriteIdx.value !== null) savedAlignments.value.custom[customOverwriteIdx.value] = entry;
    else savedAlignments.value.custom.push(entry);
    showSaveCustomModal.value = false;
  } finally {
    savingAlignment.value = false;
  }
}

async function deleteCustomAlignment(index: number) {
  if (!clanId.value) return;
  await saveClanRoster(clanId.value, { type: 'shadow-war', slot: 'custom', action: 'delete', customIndex: index });
  savedAlignments.value.custom.splice(index, 1);
}

async function renameCustomAlignment(index: number, newName: string) {
  if (!clanId.value || !newName.trim()) return;
  const entry = savedAlignments.value.custom[index];
  await saveClanRoster(clanId.value, { type: 'shadow-war', slot: 'custom', name: newName.trim(), customIndex: index, data: entry.data });
  savedAlignments.value.custom[index] = { ...entry, name: newName.trim() };
}

function applyAlignment(data: any) {
  if (!data) return;
  const findChar = (id: any) => clanMembers.value.find(c => String(c._id) === String(id));
  const padChars = (ids: any[], size: number) => {
    const chars = ids.map((id: any) => findChar(id));
    while (chars.length < size) chars.push(undefined);
    return chars.slice(0, size);
  };
  const result: any = {};
  for (const cat of ['exalted', 'eminent', 'famed', 'proud'] as const) {
    const saved = (data[cat] ?? []) as any[];
    result[cat] = Array(3).fill(null).map((_, i) => {
      const m = saved[i] ?? {};
      return {
        group1: { character: padChars(m.group1?.character ?? [], 4) },
        group2: { character: padChars(m.group2?.character ?? [], 4) },
        result: 'pending',
      };
    });
  }
  battleCategories.value = result;
  updateShadowWarData();
}

async function autoAssign() {
  if (!clanId.value) return;
  autoAssigning.value = true;
  try {
    const current = buildSWData();
    const result = await autoAssignRoster(clanId.value, 'shadow-war', current);
    applyAlignment(result);
  } finally {
    autoAssigning.value = false;
  }
}

function resetAlignment() {
  resetBattleCategories();
  updateShadowWarData();
}

function groupAvgScore(chars: any[]): string {
  const scored = (chars ?? []).filter((c: any) => c?.score != null)
  if (!scored.length) return '—'
  const avg = scored.reduce((s: number, c: any) => s + c.score, 0) / scored.length
  return avg.toLocaleString('es', { maximumFractionDigits: 0 })
}

// ── Drag & Drop ──────────────────────────────────────────────────────────────

interface SlotRef {
  category: keyof typeof battleCategories.value;
  matchIndex: number;
  group: 'group1' | 'group2';
  memberIndex: number;
}

const dragSource  = ref<SlotRef | null>(null);
const dragOverKey = ref<string | null>(null);

function slotKey(s: SlotRef) {
  return `${s.category}-${s.matchIndex}-${s.group}-${s.memberIndex}`;
}

function getSlotChar(s: SlotRef) {
  return battleCategories.value[s.category][s.matchIndex][s.group].character[s.memberIndex];
}

function setSlotChar(s: SlotRef, char: any) {
  battleCategories.value[s.category][s.matchIndex][s.group].character[s.memberIndex] = char;
}

function onDragStart(e: DragEvent, slot: SlotRef) {
  if (!getSlotChar(slot)) { e.preventDefault(); return; }
  dragSource.value = slot;
  e.dataTransfer!.effectAllowed = 'move';
}

function onDragOver(e: DragEvent, slot: SlotRef) {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
  dragOverKey.value = slotKey(slot);
}

function onDragLeave() { dragOverKey.value = null; }

function onDrop(slot: SlotRef) {
  dragOverKey.value = null;
  if (!dragSource.value) return;
  const src = dragSource.value;
  if (slotKey(src) === slotKey(slot)) { dragSource.value = null; return; }

  const srcChar = getSlotChar(src);
  const tgtChar = getSlotChar(slot);
  setSlotChar(src, tgtChar);
  setSlotChar(slot, srcChar);

  dragSource.value = null;
  updateShadowWarData();
}

function onDragEnd() {
  dragSource.value  = null;
  dragOverKey.value = null;
}
</script>

<template>
  <div class="create-shadow-war-form">

    <!-- ── Panel (create mode / read-only mode) ── -->
    <div class="create-panel">

      <!-- Panel header: title + actions (when instance exists) -->
      <div class="panel-header">
        <h5 class="create-title">{{ shadowWarData ? 'Instancia activa' : 'Nueva instancia' }}</h5>
        <div v-if="shadowWarData && !editing && !loading" class="panel-header-actions">
          <button class="btn-complete-sw" :disabled="saving" @click="completeInstance">
            <i class="fas fa-flag-checkered"></i> Completar
          </button>
          <div class="context-menu-wrapper">
            <button class="btn-dots" @click.stop="showContextMenu = !showContextMenu">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <!-- Transparent overlay to close on outside click -->
            <div v-if="showContextMenu" class="context-overlay" @click="showContextMenu = false" />
            <div v-if="showContextMenu" class="context-menu">
              <button class="ctx-item" @click="openEdit(); showContextMenu = false">
                <i class="fas fa-pen"></i> Editar
              </button>
              <button class="ctx-item ctx-item--danger" :disabled="saving" @click="closeInstance(); showContextMenu = false">
                <i class="fas fa-trash"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="instance-header-skeleton" />

      <!-- Create mode: no active instance -->
      <div v-else-if="!shadowWarData" class="create-row">
        <div class="field-col">
          <label>Fecha</label>
          <input type="date" v-model="newDate" />
        </div>
        <div class="field-col field-col--grow">
          <label>Clan Enemigo <span class="optional-tag">opcional</span></label>
          <SearchSelector
            v-model="newEnemyClan"
            :fetch-fn="searchClans"
            :selected-label="lastCreated?._id === newEnemyClan ? lastCreated?.name : undefined"
            placeholder="Buscar clan..."
            create-label="Crear clan enemigo"
            @create="(q) => handleOpenConfirm(q, 'new')"
          />
        </div>
        <button class="btn-create" :disabled="!newDate || saving" @click="createInstance">
          <i class="fas fa-plus"></i> Crear
        </button>
      </div>

      <!-- Instance active: same elements, read-only (disabled date) or edit mode (enabled date) -->
      <div v-else>
        <div class="create-row">
          <div class="field-col">
            <label>Fecha</label>
            <input
              type="date"
              :value="editing ? editDate : toInputDate(shadowWarData.date)"
              :disabled="!editing"
              @change="editing ? editDate = ($event.target as HTMLInputElement).value : undefined"
            />
          </div>
          <div class="field-col field-col--grow">
            <label>Clan Enemigo <span class="optional-tag">opcional</span></label>
            <SearchSelector
              v-if="editing"
              v-model="enemyClan"
              :fetch-fn="searchClans"
              :selected-label="lastCreated?._id === enemyClan ? lastCreated?.name : shadowWarData?.enemyClan?.name"
              placeholder="Buscar clan..."
              create-label="Crear clan enemigo"
              @create="(q) => handleOpenConfirm(q, 'edit')"
            />
            <span v-else class="enemy-clan-display">
              {{ shadowWarData?.enemyClan?.name ?? 'Aún no definido' }}
            </span>
          </div>
          <!-- Edit mode buttons stay in the same row -->
          <div v-if="editing" class="instance-actions">
            <button class="btn-save" :disabled="saving" @click="saveEdit">
              <i class="fas fa-check"></i> Guardar
            </button>
            <button class="btn-cancel" :disabled="saving" @click="cancelEdit">
              <i class="fas fa-times"></i> Cancelar
            </button>
          </div>
        </div>
        <!-- WhatsApp + Formaciones + Publicar: fila separada, siempre a la derecha -->
        <div v-if="!editing" class="instance-action-row">
          <button class="btn-share-trigger" @click="showShareModal = true">
            <i class="fas fa-share-nodes"></i> Compartir
          </button>
          <button class="btn-share-trigger" @click="showFormacionesModal = true">
            <i class="fas fa-layer-group"></i> Formaciones
          </button>
          <button class="btn-publish-trigger" @click="emit('publish')">
            <i class="fas fa-paper-plane"></i> Publicar
          </button>
        </div>
      </div>

    </div>

    <!-- ── Roster (visible only after data has loaded) ── -->
    <template v-if="shadowWarData && !loading">

      <!-- Member selection modal -->
      <MemberSelectionModal
        v-if="showMemberSelectionModal"
        :characters="clanMembers"
        :assigned-member-ids="assignedMemberIds"
        :confirmed-ids="confirmedIds"
        :assigned-details="assignedMemberDetails"
        @close="showMemberSelectionModal = false"
        @character-selected="handleMemberSelected"
        @character-unassigned="handleMemberUnassigned"
      />

      <!-- Alignment toolbar -->
      <div class="roster-toolbar">
        <div class="roster-toolbar-row">
          <button class="btn-roster-action" :disabled="savingAlignment || autoAssigning" @click="saveLastAlignment">
            <i class="fas fa-clock-rotate-left"></i> Guardar última
          </button>
          <button class="btn-roster-action" :disabled="savingAlignment || autoAssigning" @click="openSaveCustomModal">
            <i class="fas fa-bookmark"></i> Guardar plantilla
          </button>
          <button class="btn-roster-action" :disabled="savingAlignment || autoAssigning" @click="autoAssign">
            <i class="fas fa-bolt"></i> Auto-asignar
          </button>
          <button class="btn-roster-action btn-roster-action--reset" :disabled="savingAlignment || autoAssigning" @click="resetAlignment">
            <i class="fas fa-trash-alt"></i> Resetear
          </button>
        </div>
      </div>

      <CustomModal v-if="showSaveCustomModal" title="Guardar plantilla" @close="showSaveCustomModal = false">
        <div class="save-alignment-modal">
          <div class="sam-field">
            <label>Nombre</label>
            <input v-model="customAlignmentName" maxlength="24" placeholder="Ej. Ofensiva" @keydown.enter="confirmSaveCustom" />
          </div>
          <div v-if="savedAlignments.custom.length >= 3" class="sam-overwrite">
            <p>Ya tienes 3 plantillas. ¿Cuál reemplazas?</p>
            <div class="sam-slots">
              <button v-for="(slot, i) in savedAlignments.custom" :key="i" class="sam-slot" :class="{ active: customOverwriteIdx === i }" @click="customOverwriteIdx = i">
                {{ slot.name }}
              </button>
            </div>
          </div>
          <div class="sam-actions">
            <button class="btn-sam-confirm" :disabled="!customAlignmentName.trim() || (savedAlignments.custom.length >= 3 && customOverwriteIdx === null) || savingAlignment" @click="confirmSaveCustom">
              <i class="fas fa-check"></i> Guardar
            </button>
            <button class="btn-sam-cancel" @click="showSaveCustomModal = false">
              <i class="fas fa-times"></i> Cancelar
            </button>
          </div>
        </div>
      </CustomModal>

      <!-- Battle categories -->
      <div
        v-for="(category, categoryName) in battleCategories"
        :key="categoryName"
        class="battle-card"
      >
        <!-- Card header -->
        <div class="battle-card-header" @click="toggleCategory(String(categoryName))">
          <div class="battle-card-meta">
            <i class="fas fa-swords"></i>
            <span class="battle-card-name">Batalla {{ translatedCategoryName(categoryName) }}</span>
            <span class="battle-card-count">{{ categoryStats(String(categoryName)).assigned }}/24</span>
          </div>
          <button class="btn-expand" @click.stop="toggleCategory(String(categoryName))">
            <i :class="expandedCategories.includes(String(categoryName)) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </button>
        </div>

        <!-- Card body (collapsible) -->
        <div v-if="expandedCategories.includes(String(categoryName))" class="battle-card-body">
          <div v-for="(match, matchIndex) in category" :key="matchIndex" class="battle-match">
            <h5 class="match-title">
              Partida {{ matchIndex + 1 }}
              <span class="group-avg-score">⌀ {{ groupAvgScore([...match.group1.character, ...match.group2.character]) }}</span>
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
                      'is-dragging': dragSource && slotKey(dragSource) === slotKey({ category: categoryName, matchIndex, group: grp, memberIndex: n - 1 }),
                      'drag-over':   dragOverKey === slotKey({ category: categoryName, matchIndex, group: grp, memberIndex: n - 1 })
                    }"
                    :draggable="!!match[grp].character[n - 1]"
                    @dragstart="onDragStart($event, { category: categoryName, matchIndex, group: grp, memberIndex: n - 1 })"
                    @dragover.prevent="onDragOver($event, { category: categoryName, matchIndex, group: grp, memberIndex: n - 1 })"
                    @dragleave="onDragLeave"
                    @drop="onDrop({ category: categoryName, matchIndex, group: grp, memberIndex: n - 1 })"
                    @dragend="onDragEnd"
                  >
                    <ShadowWarMemberCard
                      :character="match[grp].character[n - 1]"
                      :show-unassign-button="!!match[grp].character[n - 1]"
                      :confirmed-ids="confirmedIds"
                      :declined-ids="declinedIds"
                      :can-confirm="String(match[grp].character[n - 1]?._id) === store.currentCharacter"
                      :confirming="respondingCharId === String(match[grp].character[n - 1]?._id)"
                      @click="openMemberSelection(categoryName, grp, matchIndex, n - 1)"
                      @unassign="unassignMember(categoryName, grp, matchIndex, n - 1)"
                      @respond="(action) => handleRespond(action, String(match[grp].character[n - 1]?._id))"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </template>

    <ShareModal v-if="showShareModal" @close="showShareModal = false" />
    <FormacionesModal
      v-if="showFormacionesModal"
      :saved-alignments="savedAlignments"
      :clan-members="clanMembers"
      :clan-id="clanId"
      :character-id="store.currentCharacter"
      :current-war-id="shadowWarId"
      @apply="applyAlignment"
      @rename-template="renameCustomAlignment"
      @delete-template="deleteCustomAlignment"
      @close="showFormacionesModal = false"
    />

  </div>

  <Teleport to="body">
    <div v-if="showConfirmModal" class="create-clan-overlay" @click.self="showConfirmModal = false; createClanError = ''">
      <div class="create-clan-modal">
        <h4 class="create-clan-title">Crear clan enemigo</h4>
        <p class="create-clan-confirm-text">¿Crear el clan <strong>{{ pendingClanName }}</strong>?</p>
        <p v-if="createClanError" class="create-clan-error">{{ createClanError }}</p>
        <div class="create-clan-actions">
          <button class="btn-create-clan" :disabled="creatingClan" @click="handleConfirmCreate">
            <i class="fas fa-check"></i> Confirmar
          </button>
          <button class="btn-cancel-modal" :disabled="creatingClan" @click="showConfirmModal = false; createClanError = ''">
            <i class="fas fa-times"></i> Cancelar
          </button>
        </div>
      </div>
    </div>
  </Teleport>

</template>

<style scoped lang="scss" src="./CreateShadowWarForm.scss" />
