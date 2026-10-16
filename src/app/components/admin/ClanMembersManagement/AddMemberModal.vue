<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import CustomModal from '../../Modals/CustomModal.vue';
import LabeledInput from '../../Inputs/LabeledInput.vue';
import { classes } from '../../../../middlewares/misc/const';
import {
  addClanMember,
  createClanCharacter,
  updateMemberRole,
  updateClanMember,
  sendClanInvitation,
  bulkImportMembers,
} from '../../../../middlewares/services';
import { getCharacterByName } from '../../../../middlewares/services/characterService';
import { getClassImage, getClassName, clanHistorySummary } from './memberDisplay';

/**
 * Modal: agregar miembro al clan.
 * Pasos: 1 buscar · 2 confirmar / invitar · 3 crear personaje · 4 importar archivo.
 */
const props = defineProps<{
  clanId: string;
  isLeader: boolean;
  isOfficer: boolean;
  /** Recarga el clan en el componente padre. */
  reload: () => Promise<void>;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const addStep          = ref<1 | 2 | 3 | 4>(1);
const searchName       = ref('');
const searchResults    = ref<any[]>([]);
const selectedChar     = ref<any>(null);
const searchLoading    = ref(false);
const newClass         = ref('');
const newResonance     = ref<number | ''>('');
const addRole          = ref<'officer' | 'member'>('member');
const addEditClass     = ref('');
const addEditResonance = ref<number | ''>('');
const addLoading       = ref(false);
const addError         = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Paso 4: importación masiva
const importFile    = ref<File | null>(null);
const importLoading = ref(false);
const importError   = ref('');
const importResults = ref<{ name: string; status: string; reason?: string }[]>([]);
const importDone    = ref(false);

function close() {
  if (debounceTimer) clearTimeout(debounceTimer);
  emit('close');
}

onUnmounted(() => { if (debounceTimer) clearTimeout(debounceTimer); });

watch(searchName, (val) => {
  if (addStep.value !== 1) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  if (val.trim().length < 2) { searchResults.value = []; return; }
  debounceTimer = setTimeout(doSearch, 800);
});

async function doSearch() {
  searchLoading.value = true;
  const res = await getCharacterByName(searchName.value.trim());
  searchResults.value = res?.found ? res.characters : [];
  searchLoading.value = false;
}

function selectCharacter(char: any) {
  selectedChar.value     = char;
  addEditClass.value     = char.currentClass ?? '';
  addEditResonance.value = char.resonance    ?? '';
  addStep.value = 2;
}

function goToCreate() {
  addError.value = '';
  addStep.value = 3;
}

function goToImport() {
  importFile.value    = null;
  importError.value   = '';
  importResults.value = [];
  importDone.value    = false;
  addStep.value       = 4;
}

function backToSearch() {
  addError.value = '';
  addStep.value = 1;
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  importFile.value  = input.files?.[0] ?? null;
  importError.value = '';
}

async function handleBulkImport() {
  if (!importFile.value) return;
  importLoading.value = true;
  importError.value   = '';
  importResults.value = [];
  importDone.value    = false;
  try {
    const res = await bulkImportMembers(props.clanId, importFile.value);
    importResults.value = res.results ?? [];
    importDone.value    = true;
    await props.reload();
  } catch (e: any) {
    importError.value = e?.response?.data?.message ?? 'Error al importar el archivo.';
  } finally {
    importLoading.value = false;
  }
}

async function confirmAdd() {
  if (!selectedChar.value) return;
  addLoading.value = true;
  addError.value   = '';
  try {
    await addClanMember(props.clanId, selectedChar.value._id);
    if (props.isLeader && addRole.value === 'officer') {
      await updateMemberRole(props.clanId, selectedChar.value._id, 'officer');
    }
    if (props.isLeader || props.isOfficer) {
      await updateClanMember(props.clanId, selectedChar.value._id, {
        currentClass: addEditClass.value || undefined,
        resonance:    addEditResonance.value !== '' ? Number(addEditResonance.value) : undefined,
      });
    }
    emit('close');
    await props.reload();
  } catch {
    addError.value = 'Error al agregar el miembro.';
  } finally {
    addLoading.value = false;
  }
}

async function confirmSendInvitation() {
  if (!selectedChar.value) return;
  addLoading.value = true;
  addError.value   = '';
  try {
    await sendClanInvitation(props.clanId, {
      characterId:       selectedChar.value._id,
      role:              addRole.value,
      proposedClass:     addEditClass.value     || undefined,
      proposedResonance: addEditResonance.value !== '' ? Number(addEditResonance.value) : undefined,
    });
    emit('close');
    await props.reload();
  } catch (e: any) {
    addError.value = e?.response?.data?.message ?? 'Error al enviar la invitación.';
  } finally {
    addLoading.value = false;
  }
}

async function handleCreate() {
  if (!searchName.value.trim()) return;
  addLoading.value = true;
  addError.value   = '';
  try {
    const response = await createClanCharacter(props.clanId, {
      name:         searchName.value.trim(),
      resonance:    newResonance.value !== '' ? Number(newResonance.value) : undefined,
      currentClass: newClass.value || undefined,
    });
    if (props.isLeader && addRole.value === 'officer') {
      const newChar = response?.member?.[response.member.length - 1];
      const newCharId = newChar?._id ?? (typeof newChar === 'string' ? newChar : null);
      if (newCharId) await updateMemberRole(props.clanId, String(newCharId), 'officer');
    }
    emit('close');
    await props.reload();
  } catch {
    addError.value = 'Error al crear el personaje.';
  } finally {
    addLoading.value = false;
  }
}
</script>

<template>
  <CustomModal title="Agregar miembro" @close="close">
    <div class="modal-form">

      <!-- Paso 1: buscar -->
      <template v-if="addStep === 1">
        <p class="step-label">Buscar personaje existente</p>
        <LabeledInput label="Nombre del personaje" id="searchName" v-model="searchName" />
        <p v-if="searchLoading" class="modal-hint">Buscando...</p>

        <ul v-if="searchResults.length" class="search-results">
          <li v-for="char in searchResults" :key="char._id" class="search-result-card" @click="selectCharacter(char)">
            <div class="result-info">
              <img v-if="char.currentClass && getClassImage(char.currentClass)"
                :src="getClassImage(char.currentClass)" :alt="getClassName(char.currentClass)" width="32" />
              <i v-else class="fas fa-user-circle result-placeholder"></i>
              <div>
                <strong>{{ char.name }}</strong>
                <small>{{ char.currentClass ? getClassName(char.currentClass) : 'Sin clase' }} · {{ char.resonance ?? '—' }} res.</small>
                <small v-if="clanHistorySummary(char)" class="history-hint">{{ clanHistorySummary(char) }}</small>
              </div>
            </div>
          </li>
        </ul>

        <p v-if="addError" class="modal-error">{{ addError }}</p>
        <div class="step-actions">
          <button :disabled="searchName.trim().length < 2" @click="goToCreate">
            <i class="fas fa-plus"></i> Crear nuevo personaje
          </button>
          <button @click="goToImport">
            <i class="fas fa-file-import"></i> Importar CSV / XLSX
          </button>
        </div>
      </template>

      <!-- Paso 2: confirmar / invitar -->
      <template v-if="addStep === 2 && selectedChar">
        <p class="step-label">{{ selectedChar.status === 'claimed' ? 'Invitar al clan' : 'Confirmar personaje' }}</p>
        <div class="search-result-card selected">
          <div class="result-info">
            <img v-if="selectedChar.currentClass && getClassImage(selectedChar.currentClass)"
              :src="getClassImage(selectedChar.currentClass)" :alt="getClassName(selectedChar.currentClass)" width="36" />
            <i v-else class="fas fa-user-circle result-placeholder"></i>
            <div>
              <strong>{{ selectedChar.name }}</strong>
              <small>{{ selectedChar.currentClass ? getClassName(selectedChar.currentClass) : 'Sin clase' }} · {{ selectedChar.resonance ?? '—' }} res.</small>
              <small v-if="clanHistorySummary(selectedChar)" class="history-hint">{{ clanHistorySummary(selectedChar) }}</small>
            </div>
          </div>
        </div>
        <p v-if="selectedChar.status === 'claimed'" class="modal-hint">
          <i class="fas fa-info-circle"></i> Este personaje está vinculado a un usuario. Se le enviará una invitación para que acepte el ingreso y los cambios propuestos.
        </p>
        <div v-if="isLeader || isOfficer" class="field-group">
          <label class="field-label">Clase{{ selectedChar.status === 'claimed' ? ' (propuesta)' : '' }}</label>
          <select v-model="addEditClass">
            <option value="">Sin clase</option>
            <option v-for="cls in classes" :key="cls.value" :value="cls.value">{{ cls.name }}</option>
          </select>
        </div>
        <div v-if="isLeader || isOfficer" class="field-group">
          <label class="field-label">Resonancia{{ selectedChar.status === 'claimed' ? ' (propuesta)' : '' }}</label>
          <input type="number" v-model.number="addEditResonance" />
        </div>
        <div v-if="isLeader" class="field-group">
          <label class="field-label">Rol</label>
          <select v-model="addRole">
            <option value="member">Miembro</option>
            <option value="officer">Oficial</option>
          </select>
        </div>
        <p v-if="addError" class="modal-error">{{ addError }}</p>
        <div class="step-actions">
          <button
            :disabled="addLoading"
            class="w-100"
            @click="selectedChar.status === 'claimed' ? confirmSendInvitation() : confirmAdd()"
          >
            {{ addLoading
              ? (selectedChar.status === 'claimed' ? 'Enviando...' : 'Agregando...')
              : (selectedChar.status === 'claimed' ? 'Enviar invitación' : 'Agregar al clan') }}
          </button>
          <button class="btn-ghost" @click="backToSearch">Volver</button>
        </div>
      </template>

      <!-- Paso 4: importar CSV / XLSX -->
      <template v-if="addStep === 4">
        <p class="step-label">Importar miembros desde archivo</p>
        <p class="modal-hint">
          El archivo debe tener las columnas: <strong>Jugador, Resonancia, Armadura, Penetracion, Potencia, Resistencia, Clase, Whatsapp</strong>.
        </p>

        <div class="field-group">
          <label class="field-label">Archivo (.csv o .xlsx)</label>
          <input type="file" accept=".csv,.xlsx" @change="onFileChange" class="file-input" />
        </div>

        <div v-if="importDone && importResults.length" class="import-results">
          <div v-for="r in importResults" :key="r.name" class="import-row" :class="'import-row--' + r.status">
            <span class="import-name">{{ r.name }}</span>
            <span class="import-badge">
              <template v-if="r.status === 'created'">Creado</template>
              <template v-else-if="r.status === 'updated'">Actualizado</template>
              <template v-else-if="r.status === 'invited'">Invitado</template>
              <template v-else>Omitido</template>
            </span>
            <span v-if="r.reason" class="import-reason">{{ r.reason }}</span>
          </div>
        </div>

        <p v-if="importError" class="modal-error">{{ importError }}</p>

        <div class="step-actions">
          <button
            :disabled="importLoading || !importFile"
            class="w-100"
            @click="handleBulkImport"
          >
            <i class="fas fa-upload"></i>
            {{ importLoading ? 'Importando...' : 'Importar' }}
          </button>
          <button class="btn-ghost" @click="backToSearch">Volver</button>
        </div>
      </template>

      <!-- Paso 3: crear -->
      <template v-if="addStep === 3">
        <p class="step-label">Datos del nuevo personaje</p>
        <LabeledInput label="Nombre" id="newName" v-model="searchName" />
        <div class="field-group">
          <label class="field-label">Clase</label>
          <select v-model="newClass">
            <option value="">Sin clase</option>
            <option v-for="cls in classes" :key="cls.value" :value="cls.value">{{ cls.name }}</option>
          </select>
        </div>
        <div v-if="isLeader" class="field-group">
          <label class="field-label">Rol</label>
          <select v-model="addRole">
            <option value="member">Miembro</option>
            <option value="officer">Oficial</option>
          </select>
        </div>
        <LabeledInput label="Resonancia" id="newRes" v-model.number="newResonance" type="number" />
        <p v-if="addError" class="modal-error">{{ addError }}</p>
        <div class="step-actions">
          <button :disabled="addLoading || !searchName.trim()" class="w-100" @click="handleCreate">
            {{ addLoading ? 'Creando...' : 'Crear y agregar al clan' }}
          </button>
          <button class="btn-ghost" @click="backToSearch">Volver</button>
        </div>
      </template>

    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./ClanMemberModals.scss" />
