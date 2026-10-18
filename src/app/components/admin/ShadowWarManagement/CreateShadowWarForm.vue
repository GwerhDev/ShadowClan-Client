<script setup lang="ts">
import { ref, onMounted, Ref, computed, watch } from 'vue';
import { getClanMembers } from '../../../../middlewares/services';
import { Character, ShadowWar } from '../../../../interfaces';
import MemberSelectionModal from './MemberSelectionModal.vue';
import ShareModal from './ShareModal.vue';
import FormacionesModal from './FormacionesModal.vue';
import SaveTemplateModal from './SaveTemplateModal.vue';
import SWInstancePanel from './SWInstancePanel.vue';
import SWBattleCategoryCard from './SWBattleCategoryCard.vue';
import { useStore } from '../../../../middlewares/store';
import { useActiveCharacter } from '../../../composables/useActiveCharacter';
import { useShadowWarRoster } from '../../../composables/useShadowWarRoster';
import { useSavedAlignments } from '../../../composables/useSavedAlignments';
import { useSWKind } from '../../../composables/useSWKind';

const emit = defineEmits(['publish']);
const store = useStore();
const sw = useSWKind();

const showShareModal       = ref(false);
const showFormacionesModal = ref(false);

const clanMembers: Ref<Character[]> = ref([]);
const shadowWarData = sw.active;
const { active, clanId } = useActiveCharacter();

const shadowWarId = ref<string | null>(null);
const enemyClan   = ref('');     // instancia activa (barra de solo lectura + modo edición)
const loading     = ref(true);
const editing     = ref(false);  // modo edición del panel de la instancia activa

const {
  battleCategories, autoAssigning,
  resetBattleCategories, applyBattleData,
  assignedMemberIds, assignedMemberDetails,
  showMemberSelectionModal, openMemberSelection, handleMemberSelected, handleMemberUnassigned, unassignMember,
  dragSource, dragOverKey, slotKey, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
  buildSWData, applyAlignment, autoAssign, resetAlignment,
} = useShadowWarRoster({ shadowWarId, enemyClan, clanMembers, clanId });

const {
  savedAlignments, savingAlignment, showSaveCustomModal,
  loadSavedAlignments, saveLastAlignment, openSaveCustomModal,
  confirmSaveCustom, deleteCustomAlignment, renameCustomAlignment,
} = useSavedAlignments('shadow-war', clanId, buildSWData);

// Categorías de batalla colapsables
const expandedCategories = ref<string[]>([]);

function toggleCategory(cat: string) {
  const idx = expandedCategories.value.indexOf(cat);
  if (idx !== -1) expandedCategories.value.splice(idx, 1);
  else             expandedCategories.value.push(cat);
}

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
    await sw.api.respond(shadowWarId.value, characterId, action);
    await sw.refreshActive();
  } finally {
    respondingCharId.value = null;
  }
}

// Refleja cambios remotos de otros oficiales editando la misma instancia
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
      await sw.refreshActive();
    }

    const clanData = await (clanId.value ? getClanMembers(clanId.value) : Promise.resolve(null));

    if (clanData) {
      clanMembers.value = [
        ...(clanData.leader  ? [clanData.leader]  : []),
        ...(clanData.officer ?? []),
        ...(clanData.member  ?? []),
      ];
      loadSavedAlignments(clanData.savedShadowWarAlignments);
    }

    if (shadowWarData.value) {
      shadowWarId.value = shadowWarData.value._id ?? null;
      applyBattleData(shadowWarData.value.battle);
      if (shadowWarData.value.enemyClan) {
        enemyClan.value = shadowWarData.value.enemyClan._id;
      }
    }
  } finally {
    loading.value = false;
  }
});

function handleInstanceCreated(created: ShadowWar) {
  shadowWarId.value = created._id ?? null;
  if (created.enemyClan) enemyClan.value = created.enemyClan._id;
  applyBattleData(created.battle);
}

function handleInstanceEnded() {
  shadowWarId.value = null;
  enemyClan.value   = '';
  editing.value     = false;
  resetBattleCategories();
}
</script>

<template>
  <div class="create-shadow-war-form">

    <!-- ── Panel (modo creación / solo lectura / edición) ── -->
    <SWInstancePanel
      v-model:enemy-clan="enemyClan"
      v-model:editing="editing"
      :shadow-war-data="shadowWarData"
      :shadow-war-id="shadowWarId"
      :loading="loading"
      @created="handleInstanceCreated"
      @ended="handleInstanceEnded"
      @share="showShareModal = true"
      @publish="emit('publish')"
    />

    <!-- ── Roster (visible solo cuando los datos ya cargaron) ── -->
    <template v-if="shadowWarData && !loading">

      <MemberSelectionModal
        v-if="showMemberSelectionModal"
        :characters="clanMembers"
        :assigned-member-ids="assignedMemberIds"
        :confirmed-ids="confirmedIds"
        :assigned-details="assignedMemberDetails"
        :character-id="active?._id"
        @close="showMemberSelectionModal = false"
        @character-selected="handleMemberSelected"
        @character-unassigned="handleMemberUnassigned"
      />

      <!-- Barra de formaciones -->
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
          <button class="btn-roster-action" :disabled="savingAlignment || autoAssigning" @click="showFormacionesModal = true">
            <i class="fas fa-layer-group"></i> Formaciones
          </button>
          <button class="btn-roster-action btn-roster-action--reset" :disabled="savingAlignment || autoAssigning" @click="resetAlignment">
            <i class="fas fa-trash-alt"></i> Resetear
          </button>
        </div>
      </div>

      <SaveTemplateModal
        v-if="showSaveCustomModal"
        :custom-slots="savedAlignments.custom"
        :saving="savingAlignment"
        @close="showSaveCustomModal = false"
        @confirm="confirmSaveCustom"
      />

      <!-- Categorías de batalla -->
      <SWBattleCategoryCard
        v-for="(category, categoryName) in battleCategories"
        :key="categoryName"
        :category-name="String(categoryName)"
        :matches="category"
        :expanded="expandedCategories.includes(String(categoryName))"
        :drag-source-key="dragSource ? slotKey(dragSource) : null"
        :drag-over-key="dragOverKey"
        :confirmed-ids="confirmedIds"
        :declined-ids="declinedIds"
        :current-character-id="store.currentCharacter"
        :responding-char-id="respondingCharId"
        @toggle="toggleCategory(String(categoryName))"
        @select="openMemberSelection"
        @unassign="unassignMember"
        @respond="handleRespond"
        @dragstart="onDragStart"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @dragend="onDragEnd"
      />

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
</template>

<style scoped lang="scss" src="./CreateShadowWarForm.scss" />
