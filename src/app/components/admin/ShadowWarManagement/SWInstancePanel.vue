<script setup lang="ts">
import { ref } from 'vue';
import { useStore } from '../../../../middlewares/store';
import {
  searchClans, createShadowWarManagement, closeShadowWarManagement, updateShadowWarClan,
} from '../../../../middlewares/services';
import SearchSelector from '../../Selectors/SearchSelector.vue';
import CreateEnemyClanModal from '../../Modals/CreateEnemyClanModal.vue';
import type { EnemyClanRef, ShadowWar } from '../../../../interfaces';

/**
 * Panel superior del formulario de Guerra Sombría: crear instancia, o ver/editar/
 * eliminar la instancia activa (se completa sola cuando pasa su fecha).
 */
const props = defineProps<{
  shadowWarData: ShadowWar | null;
  shadowWarId: string | null;
  loading: boolean;
}>();

/** Clan enemigo de la instancia activa (también lo usa el roster al guardar). */
const enemyClan = defineModel<string>('enemyClan', { required: true });
/** Modo edición de la instancia activa. */
const editing   = defineModel<boolean>('editing', { required: true });

const emit = defineEmits<{
  (e: 'created', shadowWar: ShadowWar): void;
  /** La instancia se eliminó. */
  (e: 'ended'): void;
  (e: 'share'): void;
  (e: 'publish'): void;
}>();

const store = useStore();

const saving          = ref(false);
const newDate         = ref('');
const newEnemyClan    = ref('');
const editDate        = ref('');
const showContextMenu = ref(false);

// Modal de creación de clan enemigo
const showConfirmModal = ref(false);
const pendingClanName  = ref('');
const createTarget     = ref<'new' | 'edit'>('new');
const lastCreated      = ref<EnemyClanRef | null>(null);

const toInputDate = (isoStr: string | Date): string => {
  if (!isoStr) return '';
  return new Date(isoStr).toISOString().slice(0, 10);
};

function handleOpenConfirm(query: string, target: 'new' | 'edit') {
  pendingClanName.value  = query;
  createTarget.value     = target;
  showConfirmModal.value = true;
}

function handleClanCreated(created: EnemyClanRef) {
  lastCreated.value = created;
  if (createTarget.value === 'new') {
    newEnemyClan.value = created._id;
  } else {
    enemyClan.value = created._id;
  }
  showConfirmModal.value = false;
  pendingClanName.value  = '';
}

async function createInstance() {
  if (!newDate.value) return;
  saving.value = true;
  try {
    const created = await createShadowWarManagement(newDate.value, newEnemyClan.value || null, store.currentCharacter);
    store.setShadowWarData(created);
    newDate.value      = '';
    newEnemyClan.value = '';
    emit('created', created);
  } finally {
    saving.value = false;
  }
}

/** Elimina la instancia activa. */
async function deleteInstance() {
  if (!props.shadowWarId) return;
  saving.value = true;
  try {
    await closeShadowWarManagement(props.shadowWarId, store.currentCharacter ?? undefined);
    store.setShadowWarData(null);
    emit('ended');
  } finally {
    saving.value = false;
  }
}

function openEdit() {
  editDate.value = props.shadowWarData ? toInputDate(props.shadowWarData.date) : '';
  editing.value  = true;
}

function cancelEdit() {
  // Restaura el clan enemigo al valor guardado
  if (props.shadowWarData?.enemyClan) {
    enemyClan.value = props.shadowWarData.enemyClan._id;
  } else {
    enemyClan.value = '';
  }
  editing.value = false;
}

async function saveEdit() {
  if (!props.shadowWarId) return;
  saving.value = true;
  try {
    const formData: any = { enemyClan: enemyClan.value || null };
    if (editDate.value) formData.date = editDate.value;
    const updated = await updateShadowWarClan(props.shadowWarId, formData, store.currentCharacter ?? undefined);
    if (updated) store.setShadowWarData(updated);
    editing.value = false;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="create-panel">

    <!-- Encabezado: título + acciones (cuando hay instancia) -->
    <div class="panel-header">
      <h5 class="create-title">{{ shadowWarData ? 'Instancia activa' : 'Nueva instancia' }}</h5>
      <div v-if="shadowWarData && !editing && !loading" class="panel-header-actions">
        <div class="context-menu-wrapper">
          <button class="btn-dots" @click.stop="showContextMenu = !showContextMenu">
            <i class="fas fa-ellipsis-v"></i>
          </button>
          <!-- Capa transparente para cerrar al hacer clic afuera -->
          <div v-if="showContextMenu" class="context-overlay" @click="showContextMenu = false" />
          <div v-if="showContextMenu" class="context-menu">
            <button class="ctx-item" @click="openEdit(); showContextMenu = false">
              <i class="fas fa-pen"></i> Editar
            </button>
            <button class="ctx-item ctx-item--danger" :disabled="saving" @click="deleteInstance(); showContextMenu = false">
              <i class="fas fa-trash"></i> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Esqueleto de carga -->
    <div v-if="loading" class="instance-header-skeleton" />

    <!-- Modo creación: no hay instancia activa -->
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

    <!-- Instancia activa: mismos campos, solo lectura (fecha deshabilitada) o edición -->
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
        <!-- Los botones de edición quedan en la misma fila -->
        <div v-if="editing" class="instance-actions">
          <button class="btn-save" :disabled="saving" @click="saveEdit">
            <i class="fas fa-check"></i> Guardar
          </button>
          <button class="btn-cancel" :disabled="saving" @click="cancelEdit">
            <i class="fas fa-times"></i> Cancelar
          </button>
        </div>
      </div>
      <!-- Compartir + Publicar: fila separada, siempre a la derecha -->
      <div v-if="!editing" class="instance-action-row">
        <button class="btn-share-trigger" @click="emit('share')">
          <i class="fas fa-share-nodes"></i> Compartir
        </button>
        <button class="btn-publish-trigger" @click="emit('publish')">
          <i class="fas fa-paper-plane"></i> Publicar
        </button>
      </div>
    </div>

    <CreateEnemyClanModal
      v-if="showConfirmModal"
      :name="pendingClanName"
      confirm-label="Confirmar"
      lock-cancel-while-creating
      @close="showConfirmModal = false"
      @created="handleClanCreated"
    />
  </div>
</template>

<style scoped lang="scss" src="./SWInstancePanel.scss" />
