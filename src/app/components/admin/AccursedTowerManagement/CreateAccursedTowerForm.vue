<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from '../../../../middlewares/store';
import { getClanMembers, getAccursedTowers, getAccursedTowerManagement, createAccursedTower, updateAccursedTower, deactivateAccursedTower, searchClans, respondToTowerWar } from '../../../../middlewares/services';
import CreateEnemyClanModal from '../../Modals/CreateEnemyClanModal.vue';
import { Character, EnemyClanRef } from '../../../../interfaces';
import MemberSelectionModal from '../ShadowWarManagement/MemberSelectionModal.vue';
import SaveTemplateModal from '../ShadowWarManagement/SaveTemplateModal.vue';
import SearchSelector from '../../Selectors/SearchSelector.vue';
import AccursedTowerShareModal from './AccursedTowerShareModal.vue';
import AccursedTowerPublishModal from './AccursedTowerPublishModal.vue';
import ATRosterGroups from './ATRosterGroups.vue';
import ATRosterToolbar from './ATRosterToolbar.vue';
import ATInstanceSummary from './ATInstanceSummary.vue';
import { useActiveCharacter } from '../../../composables/useActiveCharacter';
import { useAccursedTowerRoster, rosterFromTower } from '../../../composables/useAccursedTowerRoster';
import { useSavedAlignments } from '../../../composables/useSavedAlignments';

const store = useStore();

// ── Estado ────────────────────────────────────────────────────────────────────

const loading      = ref(true);
const saving       = ref(false);
const towerWars    = ref<any[]>([]);
const clanMembers  = ref<Character[]>([]);

// Modal de creación de clan enemigo
const showConfirmModal = ref(false);
const pendingClanName  = ref('');
const createTarget     = ref<'new' | 'edit'>('new');
const lastCreated      = ref<EnemyClanRef | null>(null);

// Formulario de creación
const newTowerNumber  = ref<number | null>(null);
const newDate         = ref('');
const newEnemyClan    = ref('');

// Modales por instancia
const shareModalTower   = ref<any>(null);
const publishModalTower = ref<any>(null);

// Modo edición
const editingId         = ref<string | null>(null);
const editValues        = ref({ towerNumber: null as number | null, date: '', enemyClan: '' });

// Instancia expandida
const expandedId = ref<string | null>(null);

const { active, clanId } = useActiveCharacter();

const {
  localRoster, autoAssigning, assignedIds,
  loadRoster, buildATData, applyAlignment, autoAssign, resetRoster,
  showModal, openModal, handleMemberSelected, unassign,
  dragSource, dragOverKey, slotKey, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, resetDrag,
} = useAccursedTowerRoster({ expandedId, towerWars, clanMembers, clanId });

const {
  savedAlignments, savingAlignment, showSaveCustomModal,
  loadSavedAlignments, saveLastAlignment, openSaveCustomModal,
  confirmSaveCustom, deleteCustomAlignment,
} = useSavedAlignments('accursed-tower', clanId, buildATData, () => !!expandedId.value);

// ── Helpers ───────────────────────────────────────────────────────────────────

const isLeaderOrOfficer = computed(() => {
  const role = store.currentUser.userData?.role;
  if (role === 'admin' || role === 'super_admin') return true;
  if (!active.value?.clan) return false;
  const clan   = active.value.clan;
  const charId = String(active.value._id);
  return String(clan.leader) === charId || (clan.officer ?? []).some((o: any) => String(o) === charId);
});

const toInputDate = (isoStr: string): string => {
  if (!isoStr) return '';
  return new Date(isoStr).toISOString().slice(0, 10);
};

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
  } catch { /* se ignora silenciosamente */ }
  finally { respondingCharId.value = null; }
}

// ── Clan enemigo ──────────────────────────────────────────────────────────────

function handleOpenConfirm(query: string, target: 'new' | 'edit') {
  pendingClanName.value  = query;
  createTarget.value     = target;
  showConfirmModal.value = true;
}

function handleClanCreated(created: EnemyClanRef) {
  lastCreated.value = created;
  if (createTarget.value === 'new') newEnemyClan.value = created._id;
  else editValues.value.enemyClan = created._id;
  showConfirmModal.value = false;
  pendingClanName.value  = '';
}

// ── Carga ─────────────────────────────────────────────────────────────────────

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
      loadSavedAlignments(clanData.savedAccursedTowerAlignments);
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
  if (expandedId.value === towerId) loadRoster(tower.roster);
});

// ── Crear / editar / eliminar ─────────────────────────────────────

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

function openEdit(instance: any) {
  editValues.value = {
    towerNumber: instance.towerNumber,
    date:        toInputDate(instance.date),
    enemyClan:   instance.enemyClan?._id ?? '',
  };
  editingId.value = instance._id;
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
    }, store.currentCharacter ?? undefined);
    const idx = towerWars.value.findIndex(tw => tw._id === instance._id);
    if (idx !== -1) towerWars.value[idx] = updated;
    editingId.value = null;
  } finally {
    saving.value = false;
  }
}

/** Elimina una instancia y la quita de la lista (el completado es automático al pasar la fecha). */
async function deleteInstance(id: string) {
  saving.value = true;
  try {
    await deactivateAccursedTower(id, store.currentCharacter ?? undefined);
    towerWars.value = towerWars.value.filter(tw => tw._id !== id);
    if (expandedId.value === id) expandedId.value = null;
  } finally {
    saving.value = false;
  }
}

// ── Expandir / colapsar ───────────────────────────────────────────────────────

function toggleExpand(instance: any) {
  if (expandedId.value === instance._id) {
    expandedId.value = null;
    return;
  }
  expandedId.value = instance._id;
  localRoster.value = rosterFromTower(instance.roster);
  resetDrag();
}
</script>

<template>
  <div class="tower-form">

    <!-- ── Panel de creación (siempre visible) ── -->
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

    <!-- ── Cargando ── -->
    <div v-if="loading" class="instances-list">
      <div v-for="n in 2" :key="n" class="instance-card">
        <div class="instance-header-skeleton" />
      </div>
    </div>

    <!-- ── Lista de instancias ── -->
    <div v-else class="instances-list">

      <p v-if="!towerWars.length" class="no-instances">
        No hay instancias activas creadas.
      </p>

      <div v-for="instance in towerWars" :key="instance._id" class="instance-card">

        <!-- Encabezado de la instancia (siempre visible) -->
        <div class="instance-header" @click="editingId !== instance._id && toggleExpand(instance)">

          <!-- Modo edición -->
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

          <!-- Modo solo lectura -->
          <ATInstanceSummary
            v-else
            :instance="instance"
            :expanded="expandedId === instance._id"
            :saving="saving"
            @share="shareModalTower = instance"
            @publish="publishModalTower = instance"
            @toggle-expand="toggleExpand(instance)"
            @edit="openEdit(instance)"
            @delete="deleteInstance(instance._id)"
          />

        </div>

        <!-- Formación (expandida) -->
        <div v-if="expandedId === instance._id" class="roster-section">
          <ATRosterToolbar
            :saved-alignments="savedAlignments"
            :saving-alignment="savingAlignment"
            :auto-assigning="autoAssigning"
            @save-last="saveLastAlignment"
            @save-template="openSaveCustomModal"
            @auto-assign="autoAssign"
            @reset="resetRoster"
            @apply="applyAlignment"
            @delete-template="deleteCustomAlignment"
          />

          <SaveTemplateModal
            v-if="showSaveCustomModal"
            :custom-slots="savedAlignments.custom"
            :saving="savingAlignment"
            @close="showSaveCustomModal = false"
            @confirm="confirmSaveCustom"
          />

          <ATRosterGroups
            :roster="localRoster"
            :drag-source-key="dragSource ? slotKey(dragSource.group, dragSource.index) : null"
            :drag-over-key="dragOverKey"
            :confirmed-ids="confirmedIds"
            :declined-ids="declinedIds"
            :current-character-id="store.currentCharacter"
            :responding-char-id="respondingCharId"
            @select="openModal"
            @unassign="unassign"
            @respond="handleRespond"
            @dragstart="onDragStart"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
            @dragend="onDragEnd"
          />
        </div>

      </div>
    </div>

    <!-- Modales de compartir / publicar -->
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

    <!-- Modal de creación de clan enemigo -->
    <CreateEnemyClanModal
      v-if="showConfirmModal"
      :name="pendingClanName"
      :denied="!isLeaderOrOfficer"
      @close="showConfirmModal = false"
      @created="handleClanCreated"
    />

    <!-- Modal de selección de miembros -->
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
