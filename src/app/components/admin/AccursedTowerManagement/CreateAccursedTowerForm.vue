<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from '../../../../middlewares/store';
import { getClanMembers, getAccursedTowers, getAccursedTowerManagement, createAccursedTower, updateAccursedTower, deactivateAccursedTower, completeAccursedTower, searchClans, createEnemyClan, saveClanRoster, autoAssignRoster, respondToTowerWar } from '../../../../middlewares/services';
import CustomModal from '../../Modals/CustomModal.vue';
import { Character } from '../../../../interfaces';
import AccursedTowerMemberCard from './AccursedTowerMemberCard.vue';
import MemberSelectionModal from './MemberSelectionModal.vue';
import SearchSelector from '../../Selectors/SearchSelector.vue';
import AccursedTowerShareModal from './AccursedTowerShareModal.vue';
import AccursedTowerPublishModal from './AccursedTowerPublishModal.vue';

const store: any = useStore();

// ── State ─────────────────────────────────────────────────────────────────────

const loading      = ref(true);
const saving       = ref(false);
const towerWars    = ref<any[]>([]);
const clanMembers  = ref<Character[]>([]);

// Create clan modal
const showConfirmModal = ref(false);
const pendingClanName  = ref('');
const createTarget     = ref<'new' | 'edit'>('new');
const creatingClan     = ref(false);
const createClanError  = ref('');
const lastCreated      = ref<{ _id: string; name: string } | null>(null);

// Create form
const newTowerNumber  = ref<number | null>(null);
const newDate         = ref('');
const newEnemyClan    = ref('');

// Saved alignments
interface AlignmentSlot { name: string; data: any }
interface SavedAlignments { last: any | null; custom: AlignmentSlot[] }
const savedAlignments     = ref<SavedAlignments>({ last: null, custom: [] });
const savingAlignment     = ref(false);
const autoAssigning       = ref(false);
const showSaveCustomModal = ref(false);
const customAlignmentName = ref('');
const customOverwriteIdx  = ref<number | null>(null);

// Modals per instance
const shareModalTower   = ref<any>(null);
const publishModalTower = ref<any>(null);

// Context menu & edit mode
const showContextMenuId = ref<string | null>(null);
const ctxMenuPos        = ref({ top: 0, left: 0 });
const editingId         = ref<string | null>(null);
const editValues        = ref({ towerNumber: null as number | null, date: '', enemyClan: '' });

function toggleContextMenu(e: MouseEvent, id: string) {
  if (showContextMenuId.value === id) {
    showContextMenuId.value = null;
    return;
  }
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  ctxMenuPos.value = { top: rect.bottom + 4, left: rect.right };
  showContextMenuId.value = id;
}

const toInputDate = (isoStr: string): string => {
  if (!isoStr) return '';
  return new Date(isoStr).toISOString().slice(0, 10);
};

function openEdit(instance: any) {
  editValues.value = {
    towerNumber: instance.towerNumber,
    date:        toInputDate(instance.date),
    enemyClan:   instance.enemyClan?._id ?? '',
  };
  editingId.value = instance._id;
  showContextMenuId.value = null;
}

function cancelEdit() {
  editingId.value = null;
}

async function saveEdit(instance: any) {
  saving.value = true;
  try {
    const updated = await updateAccursedTower(instance._id, {
      towerNumber: editValues.value.towerNumber ?? undefined,
      date:        editValues.value.date || undefined,
      enemyClan:   editValues.value.enemyClan || null,
    }, store.currentCharacter);
    const idx = towerWars.value.findIndex(tw => tw._id === instance._id);
    if (idx !== -1) towerWars.value[idx] = updated;
    editingId.value = null;
  } finally {
    saving.value = false;
  }
}

// Expanded instance
const expandedId   = ref<string | null>(null);
const localRoster  = ref<{ group1: (Character|undefined)[]; group2: (Character|undefined)[]; group3: (Character|undefined)[] }>({
  group1: Array(4).fill(undefined),
  group2: Array(4).fill(undefined),
  group3: Array(2).fill(undefined),
});

// Modal
const showModal        = ref(false);
const selectionContext = ref<{ group: 'group1'|'group2'|'group3'; index: number } | null>(null);

// Drag & drop
const dragSource  = ref<{ group: 'group1'|'group2'|'group3'; index: number } | null>(null);
const dragOverKey = ref<string|null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

const chars  = computed(() => store.currentUser.userData?.character ?? []);
const active = computed(() => (chars.value as any[]).find((c: any) => c._id === store.currentCharacter) ?? chars.value[0] ?? null);
const clanId = computed(() => active.value?.clan?._id ?? active.value?.clan ?? null);

const isLeaderOrOfficer = computed(() => {
  const role = store.currentUser.userData?.role;
  if (role === 'admin' || role === 'super_admin') return true;
  if (!active.value?.clan) return false;
  const clan   = active.value.clan;
  const charId = String(active.value._id);
  return String(clan.leader) === charId || (clan.officer ?? []).some((o: any) => String(o) === charId);
});

const groupSizes: Record<'group1'|'group2'|'group3', number> = {
  group1: 4, group2: 4, group3: 2,
};

function padGroup(arr: any[], size: number): (Character|undefined)[] {
  const result = [...(arr ?? [])];
  while (result.length < size) result.push(undefined);
  return result;
}

function slotKey(group: string, index: number) { return `${group}-${index}`; }

function getSlot(group: 'group1'|'group2'|'group3', index: number) {
  return localRoster.value[group][index];
}

function setSlot(group: 'group1'|'group2'|'group3', index: number, char: Character|undefined) {
  localRoster.value[group][index] = char;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

const assignedIds = computed(() => {
  const ids = new Set<string>();
  for (const grp of ['group1', 'group2', 'group3'] as const) {
    for (const c of localRoster.value[grp]) { if (c?._id) ids.add(c._id); }
  }
  return Array.from(ids);
});

const expandedTower = computed(() => towerWars.value.find((t: any) => t._id === expandedId.value) ?? null);
const confirmedIds = computed<string[]>(() =>
  (expandedTower.value?.confirmed ?? []).map((c: any) => String(c?._id ?? c))
);
const declinedIds = computed<string[]>(() =>
  (expandedTower.value?.declined ?? []).map((c: any) => String(c?._id ?? c))
);

const respondingCharId = ref<string | null>(null);

async function handleRespond(action: 'confirm' | 'pending' | 'decline', charId: string) {
  if (!expandedId.value || !charId || respondingCharId.value) return;
  respondingCharId.value = charId;
  try {
    await respondToTowerWar(expandedId.value, charId, action);
    const fresh = await getAccursedTowerManagement(expandedId.value, store.currentCharacter ?? undefined);
    if (fresh) {
      const idx = towerWars.value.findIndex((t: any) => t._id === expandedId.value);
      if (idx !== -1) towerWars.value[idx] = fresh;
    }
  } catch { /* silently ignore */ }
  finally { respondingCharId.value = null; }
}

// ── Load ──────────────────────────────────────────────────────────────────────

function handleOpenConfirm(query: string, target: 'new' | 'edit') {
  pendingClanName.value  = query;
  createTarget.value     = target;
  createClanError.value  = '';
  showConfirmModal.value = true;
}

async function handleConfirmCreate() {
  creatingClan.value    = true;
  createClanError.value = '';
  try {
    const created = await createEnemyClan(pendingClanName.value.trim(), store.currentCharacter);
    lastCreated.value = { _id: created._id, name: created.name };
    if (createTarget.value === 'new') newEnemyClan.value = created._id;
    else editValues.value.enemyClan = created._id;
    showConfirmModal.value = false;
    pendingClanName.value  = '';
  } catch (err: any) {
    createClanError.value = err?.response?.data?.message ?? 'Error al crear el clan.';
  } finally {
    creatingClan.value = false;
  }
}

async function loadData() {
  loading.value = true;
  try {
    const [wars, clanData] = await Promise.all([
      getAccursedTowers(store.currentCharacter ?? undefined),
      clanId.value ? getClanMembers(clanId.value) : null,
    ]);

    towerWars.value = wars ?? [];

    if (clanData) {
      clanMembers.value = [
        ...(clanData.leader  ? [clanData.leader]  : []),
        ...(clanData.officer ?? []),
        ...(clanData.member  ?? []),
      ];
      if (clanData.savedAccursedTowerAlignments) {
        savedAlignments.value = {
          last:   clanData.savedAccursedTowerAlignments.last   ?? null,
          custom: clanData.savedAccursedTowerAlignments.custom ?? [],
        };
      }
    }
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);

watch(() => store.currentCharacter, (charId) => {
  if (!charId) return;
  editingId.value = null;
  loadData();
});

watch(() => store.lastUpdatedTower, (tower: any) => {
  if (!tower?._id) return;
  const towerId = String(tower._id);
  const idx = towerWars.value.findIndex((t: any) => String(t._id) === towerId);
  if (idx === -1) return;
  towerWars.value[idx] = tower;
  if (expandedId.value === towerId) {
    localRoster.value = {
      group1: padGroup(tower.roster?.group1, 4),
      group2: padGroup(tower.roster?.group2, 4),
      group3: padGroup(tower.roster?.group3, 2),
    };
  }
});

// ── Create ────────────────────────────────────────────────────────────────────

async function createInstance() {
  if (!newTowerNumber.value || !newDate.value) return;
  saving.value = true;
  try {
    const created = await createAccursedTower(newTowerNumber.value, newDate.value, newEnemyClan.value || null, store.currentCharacter ?? undefined);
    towerWars.value.push(created);
    towerWars.value.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    newTowerNumber.value = null;
    newDate.value        = '';
    newEnemyClan.value   = '';
  } finally {
    saving.value = false;
  }
}

// ── Deactivate ────────────────────────────────────────────────────────────────

async function deactivate(id: string) {
  saving.value = true;
  try {
    await deactivateAccursedTower(id, store.currentCharacter);
    towerWars.value = towerWars.value.filter(tw => tw._id !== id);
    if (expandedId.value === id) expandedId.value = null;
  } finally {
    saving.value = false;
  }
}

async function complete(id: string) {
  saving.value = true;
  try {
    await completeAccursedTower(id, store.currentCharacter);
    towerWars.value = towerWars.value.filter(tw => tw._id !== id);
    if (expandedId.value === id) expandedId.value = null;
  } finally {
    saving.value = false;
  }
}

// ── Expand / Collapse ─────────────────────────────────────────────────────────

function toggleExpand(instance: any) {
  if (expandedId.value === instance._id) {
    expandedId.value = null;
    return;
  }
  expandedId.value = instance._id;
  localRoster.value = {
    group1: padGroup(instance.roster?.group1, 4),
    group2: padGroup(instance.roster?.group2, 4),
    group3: padGroup(instance.roster?.group3, 2),
  };
  dragSource.value  = null;
  dragOverKey.value = null;
}

// ── Roster update ─────────────────────────────────────────────────────────────

async function saveRoster() {
  if (!expandedId.value) return;
  const toIds = (arr: (Character|undefined)[]) =>
    arr.map(c => c?._id ?? null);
  const updated = await updateAccursedTower(expandedId.value, {
    roster: {
      group1: toIds(localRoster.value.group1),
      group2: toIds(localRoster.value.group2),
      group3: toIds(localRoster.value.group3),
    },
  }, store.currentCharacter);
  // Sync back into list
  const idx = towerWars.value.findIndex(tw => tw._id === expandedId.value);
  if (idx !== -1) towerWars.value[idx] = updated;
}

function buildATData() {
  const toIds = (arr: (Character|undefined)[]) => arr.map(c => c?._id ?? null);
  return {
    group1: toIds(localRoster.value.group1),
    group2: toIds(localRoster.value.group2),
    group3: toIds(localRoster.value.group3),
  };
}

async function saveLastAlignment() {
  if (!clanId.value || !expandedId.value) return;
  savingAlignment.value = true;
  try {
    const data = buildATData();
    await saveClanRoster(clanId.value, { type: 'accursed-tower', slot: 'last', data });
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
    const data = buildATData();
    await saveClanRoster(clanId.value, {
      type: 'accursed-tower', slot: 'custom',
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
  await saveClanRoster(clanId.value, { type: 'accursed-tower', slot: 'custom', action: 'delete', customIndex: index });
  savedAlignments.value.custom.splice(index, 1);
}

function applyAlignment(data: any) {
  if (!data || !expandedId.value) return;
  const findChar = (id: any) => clanMembers.value.find(c => String(c._id) === String(id)) as Character | undefined;
  localRoster.value = {
    group1: padGroup((data.group1 ?? []).map(findChar), 4),
    group2: padGroup((data.group2 ?? []).map(findChar), 4),
    group3: padGroup((data.group3 ?? []).map(findChar), 2),
  };
  saveRoster();
}

function instanceAvgScore(roster: { group1?: any[]; group2?: any[]; group3?: any[] } | undefined): string {
  if (!roster) return '—'
  const all = [...(roster.group1 ?? []), ...(roster.group2 ?? []), ...(roster.group3 ?? [])]
    .filter(c => c?.score != null)
  if (!all.length) return '—'
  const avg = all.reduce((s: number, c: any) => s + (c.score ?? 0), 0) / all.length
  return avg.toLocaleString('es', { maximumFractionDigits: 0 })
}

async function autoAssign() {
  if (!clanId.value || !expandedId.value) return;
  autoAssigning.value = true;
  try {
    const result = await autoAssignRoster(clanId.value, 'accursed-tower');
    applyAlignment(result);
  } finally {
    autoAssigning.value = false;
  }
}

function resetRoster() {
  localRoster.value = {
    group1: Array(4).fill(undefined),
    group2: Array(4).fill(undefined),
    group3: Array(2).fill(undefined),
  };
  saveRoster();
}

// ── Member selection ──────────────────────────────────────────────────────────

function openModal(group: 'group1'|'group2'|'group3', index: number) {
  selectionContext.value = { group, index };
  showModal.value = true;
}

function handleMemberSelected(character: Character) {
  if (!selectionContext.value) return;
  const { group, index } = selectionContext.value;
  setSlot(group, index, character);
  showModal.value = false;
  saveRoster();
}

function unassign(group: 'group1'|'group2'|'group3', index: number) {
  setSlot(group, index, undefined);
  saveRoster();
}

// ── Drag & Drop ───────────────────────────────────────────────────────────────

function onDragStart(e: DragEvent, group: 'group1'|'group2'|'group3', index: number) {
  if (!getSlot(group, index)) { e.preventDefault(); return; }
  dragSource.value = { group, index };
  e.dataTransfer!.effectAllowed = 'move';
}

function onDragOver(e: DragEvent, group: 'group1'|'group2'|'group3', index: number) {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
  dragOverKey.value = slotKey(group, index);
}

function onDragLeave() { dragOverKey.value = null; }

function onDrop(group: 'group1'|'group2'|'group3', index: number) {
  dragOverKey.value = null;
  if (!dragSource.value) return;
  const src = dragSource.value;
  if (slotKey(src.group, src.index) === slotKey(group, index)) { dragSource.value = null; return; }

  const srcChar = getSlot(src.group, src.index);
  const tgtChar = getSlot(group, index);
  setSlot(src.group, src.index, tgtChar);
  setSlot(group, index, srcChar);

  dragSource.value = null;
  saveRoster();
}

function onDragEnd() { dragSource.value = null; dragOverKey.value = null; }
</script>

<template>
  <div class="tower-form">

    <!-- ── Create panel (always visible) ── -->
    <div class="create-panel">
      <h5 class="create-title">Nueva instancia</h5>
      <div class="create-row">
        <div class="field-col">
          <label>N° de Torre</label>
          <input class="tower-number-input" type="number" v-model="newTowerNumber" min="1" placeholder="Ej. 12" />
        </div>
        <div class="field-col">
          <label>Fecha</label>
          <input type="date" v-model="newDate" />
        </div>
        <div class="field-col field-col--grow">
          <label>Clan Enemigo <span class="optional-tag">opcional</span></label>
          <SearchSelector v-model="newEnemyClan" :fetch-fn="searchClans" :selected-label="lastCreated?.name" placeholder="Buscar clan..." create-label="Crear clan enemigo" @create="(q) => handleOpenConfirm(q, 'new')" />
        </div>
        <button class="btn-create" :disabled="!newTowerNumber || !newDate || saving" @click="createInstance">
          <i class="fas fa-plus"></i> Crear
        </button>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading" class="instances-list">
      <div v-for="n in 2" :key="n" class="instance-card">
        <div class="instance-header-skeleton" />
      </div>
    </div>

    <!-- ── Instances list ── -->
    <div v-else class="instances-list">

      <p v-if="!towerWars.length" class="no-instances">
        No hay instancias activas creadas.
      </p>

      <div v-for="instance in towerWars" :key="instance._id" class="instance-card">

        <!-- Instance header (always visible) -->
        <div class="instance-header" @click="editingId !== instance._id && toggleExpand(instance)">

          <!-- Edit mode -->
          <template v-if="editingId === instance._id">
            <div class="instance-edit-row" @click.stop>
              <div class="field-col">
                <label>N° de Torre</label>
                <input class="tower-number-input" type="number" v-model="editValues.towerNumber" min="1" />
              </div>
              <div class="field-col">
                <label>Fecha</label>
                <input type="date" v-model="editValues.date" />
              </div>
              <div class="field-col field-col--grow">
                <label>Clan Enemigo <span class="optional-tag">opcional</span></label>
                <SearchSelector v-model="editValues.enemyClan" :fetch-fn="searchClans" :selected-label="lastCreated?.name ?? instance.enemyClan?.name" placeholder="Buscar clan..." create-label="Crear clan enemigo" @create="(q) => handleOpenConfirm(q, 'edit')" />
              </div>
              <div class="instance-actions">
                <button class="btn-save" :disabled="saving" @click="saveEdit(instance)">
                  <i class="fas fa-check"></i> Guardar
                </button>
                <button class="btn-cancel" :disabled="saving" @click="cancelEdit">
                  <i class="fas fa-times"></i> Cancelar
                </button>
              </div>
            </div>
          </template>

          <!-- Read-only mode -->
          <template v-else>
            <div class="instance-meta">
              <i class="fas fa-chess-rook"></i>
              <span class="instance-tower-name">Torre {{ instance.towerNumber }}</span>
              <span class="instance-date">{{ formatDate(instance.date) }}</span>
              <span v-if="instance.enemyClan" class="instance-enemy">vs {{ instance.enemyClan.name }}</span>
              <span class="instance-avg-score">⌀ {{ instanceAvgScore(instance.roster) }}</span>
            </div>
            <div class="instance-actions" @click.stop>
              <button class="btn-share-trigger" @click="shareModalTower = instance">
                <i class="fas fa-share-nodes"></i> Compartir
              </button>
              <button class="btn-publish-trigger" @click="publishModalTower = instance">
                <i class="fas fa-paper-plane"></i> Publicar
              </button>
              <button class="btn-complete" :disabled="saving" title="Completar" @click="complete(instance._id)">
                <i class="fas fa-flag-checkered"></i>
              </button>
              <button class="btn-expand" @click="toggleExpand(instance)">
                <i :class="expandedId === instance._id ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
              </button>
              <!-- Context menu (Teleport to body to escape overflow:hidden) -->
              <div class="context-menu-wrapper">
                <button class="btn-dots" @click.stop="toggleContextMenu($event, instance._id)">
                  <i class="fas fa-ellipsis-v"></i>
                </button>
                <Teleport to="body">
                  <template v-if="showContextMenuId === instance._id">
                    <div class="context-overlay" @click="showContextMenuId = null" />
                    <div class="context-menu context-menu--fixed"
                         :style="{ top: ctxMenuPos.top + 'px', left: ctxMenuPos.left + 'px', transform: 'translateX(-100%)' }">
                      <button class="ctx-item" @click="openEdit(instance); showContextMenuId = null">
                        <i class="fas fa-pen"></i> Editar
                      </button>
                      <button class="ctx-item ctx-item--danger" :disabled="saving" @click="deactivate(instance._id); showContextMenuId = null">
                        <i class="fas fa-trash"></i> Eliminar
                      </button>
                    </div>
                  </template>
                </Teleport>
              </div>
            </div>
          </template>

        </div>

        <!-- Roster (expanded) -->
        <div v-if="expandedId === instance._id" class="roster-section">
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
              <button class="btn-roster-action btn-roster-action--reset" :disabled="savingAlignment || autoAssigning" @click="resetRoster">
                <i class="fas fa-trash-alt"></i> Resetear
              </button>
            </div>
            <div v-if="savedAlignments.last || savedAlignments.custom.length > 0" class="roster-toolbar-row roster-toolbar-row--apply">
              <span class="apply-label">Aplicar:</span>
              <button v-if="savedAlignments.last" class="btn-roster-action btn-roster-action--apply" :disabled="savingAlignment" @click="applyAlignment(savedAlignments.last)">
                <i class="fas fa-clock-rotate-left"></i> Última
              </button>
              <span v-for="(slot, i) in savedAlignments.custom" :key="i" class="alignment-chip">
                <button class="btn-roster-action btn-roster-action--apply" :disabled="savingAlignment" :title="slot.name" @click="applyAlignment(slot.data)">
                  <i class="fas fa-bookmark"></i> {{ slot.name }}
                </button>
                <button class="btn-chip-delete" :disabled="savingAlignment" title="Eliminar plantilla" @click="deleteCustomAlignment(i)">
                  <i class="fas fa-times"></i>
                </button>
              </span>
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
          <div class="groups-layout">

            <div v-for="grp in (['group1', 'group2'] as const)" :key="grp" class="group-section">
              <h5>{{ grp === 'group1' ? 'Grupo 1' : 'Grupo 2' }} <span class="size-badge">×4</span></h5>
              <div class="cards-grid">
                <div
                  v-for="n in groupSizes[grp]"
                  :key="n"
                  class="drag-slot"
                  :class="{
                    'is-dragging': dragSource && slotKey(dragSource.group, dragSource.index) === slotKey(grp, n-1),
                    'drag-over':   dragOverKey === slotKey(grp, n-1)
                  }"
                  :draggable="!!localRoster[grp][n-1]"
                  @dragstart="onDragStart($event, grp, n-1)"
                  @dragover.prevent="onDragOver($event, grp, n-1)"
                  @dragleave="onDragLeave"
                  @drop="onDrop(grp, n-1)"
                  @dragend="onDragEnd"
                >
                  <AccursedTowerMemberCard
                    :character="localRoster[grp][n-1]"
                    :show-unassign-button="!!localRoster[grp][n-1]"
                    :confirmed-ids="confirmedIds"
                    :declined-ids="declinedIds"
                    :can-confirm="String(localRoster[grp][n-1]?._id) === store.currentCharacter"
                    :confirming="respondingCharId === String(localRoster[grp][n-1]?._id)"
                    @click="openModal(grp, n-1)"
                    @unassign="unassign(grp, n-1)"
                    @respond="(action) => handleRespond(action, String(localRoster[grp][n-1]?._id))"
                  />
                </div>
              </div>
            </div>

            <div class="group-section group3-section">
              <h5>Grupo 3 <span class="size-badge">×2</span></h5>
              <div class="cards-grid cards-grid--2">
                <div
                  v-for="n in groupSizes.group3"
                  :key="n"
                  class="drag-slot"
                  :class="{
                    'is-dragging': dragSource && slotKey(dragSource.group, dragSource.index) === slotKey('group3', n-1),
                    'drag-over':   dragOverKey === slotKey('group3', n-1)
                  }"
                  :draggable="!!localRoster.group3[n-1]"
                  @dragstart="onDragStart($event, 'group3', n-1)"
                  @dragover.prevent="onDragOver($event, 'group3', n-1)"
                  @dragleave="onDragLeave"
                  @drop="onDrop('group3', n-1)"
                  @dragend="onDragEnd"
                >
                  <AccursedTowerMemberCard
                    :character="localRoster.group3[n-1]"
                    :show-unassign-button="!!localRoster.group3[n-1]"
                    :confirmed-ids="confirmedIds"
                    :declined-ids="declinedIds"
                    :can-confirm="String(localRoster.group3[n-1]?._id) === store.currentCharacter"
                    :confirming="respondingCharId === String(localRoster.group3[n-1]?._id)"
                    @click="openModal('group3', n-1)"
                    @unassign="unassign('group3', n-1)"
                    @respond="(action) => handleRespond(action, String(localRoster.group3[n-1]?._id))"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- Share / Publish modals -->
    <AccursedTowerShareModal
      v-if="shareModalTower"
      :tower="shareModalTower"
      @close="shareModalTower = null"
    />
    <AccursedTowerPublishModal
      v-if="publishModalTower"
      :tower="publishModalTower"
      @close="publishModalTower = null"
    />

    <!-- Create clan modal -->
    <Teleport to="body">
      <div v-if="showConfirmModal" class="create-clan-overlay" @click.self="showConfirmModal = false">
        <div class="create-clan-modal">
          <h4 class="create-clan-title">Crear clan enemigo</h4>
          <div v-if="!isLeaderOrOfficer" class="create-clan-denied">
            <i class="fas fa-lock"></i>
            <p>Solo líderes u oficiales pueden crear clanes.</p>
          </div>
          <template v-else>
            <p class="create-clan-confirm-text">
              ¿Crear el clan <strong>{{ pendingClanName }}</strong>?
            </p>
            <p v-if="createClanError" class="create-clan-error">{{ createClanError }}</p>
            <div class="create-clan-actions">
              <button class="btn-create-clan" :disabled="creatingClan" @click="handleConfirmCreate">
                <i class="fas fa-check"></i> Crear
              </button>
              <button class="btn-cancel-modal" @click="showConfirmModal = false; createClanError = ''">
                <i class="fas fa-times"></i> Cancelar
              </button>
            </div>
          </template>
        </div>
      </div>
    </Teleport>

    <!-- Member modal -->
    <MemberSelectionModal
      v-if="showModal"
      :characters="clanMembers"
      :assigned-member-ids="assignedIds"
      @close="showModal = false"
      @character-selected="handleMemberSelected"
    />

  </div>
</template>

<style scoped lang="scss" src="./CreateAccursedTowerForm.scss" />
