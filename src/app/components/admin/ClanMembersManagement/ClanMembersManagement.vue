<style scoped lang="scss" src="./ClanMembersManagement.scss" />
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from '../../../../middlewares/store';
import TableComponent from '../../Tables/TableComponent.vue';
import CustomModal from '../../Modals/CustomModal.vue';
import LabeledInput from '../../Inputs/LabeledInput.vue';
import ClanMemberCard from './ClanMemberCard.vue';
import PendingInvitationCard from './PendingInvitationCard.vue';
import { classes } from '../../../../middlewares/misc/const';
import {
  getClanMembers,
  addClanMember,
  createClanCharacter,
  updateMemberRole,
  updateClanMember,
  sendClanInvitation,
  getClanRequestsManagement,
  reviewClanRequest,
} from '../../../../middlewares/services';
import { getCharacterByName } from '../../../../middlewares/services/characterService';

const store: any = useStore();

const chars  = computed(() => store.currentUser.userData?.character ?? []);
const active = computed(() => (chars.value as any[]).find((c: any) => c._id === store.currentCharacter) ?? chars.value[0] ?? null);
const clanId = computed(() => active.value?.clan?._id ?? active.value?.clan ?? null);

const clan    = ref<any>(null);
const loading = ref(true);
const error   = ref<string | null>(null);

const navItems = ['estado', 'nombre', 'rol', 'clase', 'resonancia', 'acciones'];

const isLeader = computed(() => {
  if (!clan.value) return false;
  const leaderId = String(clan.value.leader?._id ?? clan.value.leader ?? '');
  if (!leaderId) return false;
  const userChars = store.currentUser.userData?.character ?? [];
  return (userChars as any[]).some((c: any) => String(c._id ?? c) === leaderId);
});

const isOfficer = computed(() => {
  if (!clan.value) return false;
  const userChars = store.currentUser.userData?.character ?? [];
  const userCharIds = (userChars as any[]).map((c: any) => String(c._id ?? c));
  return (clan.value.officer ?? []).some((o: any) => userCharIds.includes(String(o._id ?? o)));
});

const allMembers = computed(() => {
  if (!clan.value) return [];
  const result: Array<{ char: any; role: 'leader' | 'officer' | 'member' }> = [];
  if (clan.value.leader) result.push({ char: clan.value.leader, role: 'leader' });
  for (const o of clan.value.officer ?? []) result.push({ char: o, role: 'officer' });
  for (const m of clan.value.member  ?? []) result.push({ char: m, role: 'member' });
  return result;
});

onMounted(() => { loadClan(); });

const pendingInvitations = ref<any[]>([]);

async function loadClan() {
  if (!clanId.value) return;
  loading.value = true;
  error.value   = null;
  try {
    const data = await getClanMembers(clanId.value);
    clan.value = data;
    pendingInvitations.value = data.pendingInvitations ?? [];
  } catch {
    error.value = 'Error al cargar los miembros del clan.';
  } finally {
    loading.value = false;
  }
}

// ── Incoming clan requests modal ──
const showRequestsModal  = ref(false);
const clanRequests       = ref<any[]>([]);
const requestsLoading    = ref(false);
const requestsError      = ref('');
const reviewingId        = ref<string | null>(null);

async function openRequestsModal() {
  showRequestsModal.value = true;
  requestsLoading.value   = true;
  requestsError.value     = '';
  try {
    clanRequests.value = await getClanRequestsManagement();
  } catch {
    requestsError.value = 'Error al cargar las solicitudes.';
  } finally {
    requestsLoading.value = false;
  }
}

async function handleReviewRequest(id: string, action: 'accept' | 'reject') {
  reviewingId.value = id;
  requestsError.value = '';
  try {
    await reviewClanRequest(id, action);
    clanRequests.value = clanRequests.value.filter(r => r._id !== id);
    if (store.pendingRequestsCount > 0) store.pendingRequestsCount--;
    await loadClan();
  } catch {
    requestsError.value = 'Error al procesar la solicitud.';
  } finally {
    reviewingId.value = null;
  }
}

// ── Add member modal (3-step flow) ──
const showAddModal    = ref(false);
const addStep         = ref<1 | 2 | 3>(1);
const searchName      = ref('');
const searchResults   = ref<any[]>([]);
const selectedChar    = ref<any>(null);
const searchLoading   = ref(false);
const newClass        = ref('');
const newResonance    = ref<number | ''>('');
const addRole         = ref<'officer' | 'member'>('member');
const addEditClass    = ref('');
const addEditResonance = ref<number | ''>('');
const addLoading      = ref(false);
const addError        = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function openAddModal() {
  addStep.value        = 1;
  searchName.value     = '';
  searchResults.value  = [];
  selectedChar.value   = null;
  newClass.value       = '';
  newResonance.value   = '';
  addRole.value        = 'member';
  addEditClass.value   = '';
  addEditResonance.value = '';
  addError.value       = '';
  showAddModal.value   = true;
}

function closeAddModal() {
  showAddModal.value = false;
  if (debounceTimer) clearTimeout(debounceTimer);
}

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

function backToSearch() {
  addError.value = '';
  addStep.value = 1;
}

async function confirmAdd() {
  if (!selectedChar.value) return;
  addLoading.value = true;
  addError.value   = '';
  try {
    await addClanMember(clanId.value, selectedChar.value._id);
    if (isLeader.value && addRole.value === 'officer') {
      await updateMemberRole(clanId.value, selectedChar.value._id, 'officer');
    }
    if (isLeader.value || isOfficer.value) {
      await updateClanMember(clanId.value, selectedChar.value._id, {
        currentClass: addEditClass.value || undefined,
        resonance:    addEditResonance.value !== '' ? Number(addEditResonance.value) : undefined,
      });
    }
    showAddModal.value = false;
    await loadClan();
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
    await sendClanInvitation(clanId.value, {
      characterId:       selectedChar.value._id,
      role:              addRole.value,
      proposedClass:     addEditClass.value     || undefined,
      proposedResonance: addEditResonance.value !== '' ? Number(addEditResonance.value) : undefined,
    });
    showAddModal.value = false;
    await loadClan();
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
    const response = await createClanCharacter(clanId.value, {
      name:         searchName.value.trim(),
      resonance:    newResonance.value !== '' ? Number(newResonance.value) : undefined,
      currentClass: newClass.value || undefined,
    });
    if (isLeader.value && addRole.value === 'officer') {
      const newChar = response?.member?.[response.member.length - 1];
      const newCharId = newChar?._id ?? (typeof newChar === 'string' ? newChar : null);
      if (newCharId) await updateMemberRole(clanId.value, String(newCharId), 'officer');
    }
    showAddModal.value = false;
    await loadClan();
  } catch {
    addError.value = 'Error al crear el personaje.';
  } finally {
    addLoading.value = false;
  }
}

function getClassImage(value: string) {
  return classes.find(c => c.value === value)?.image ?? '';
}
function getClassName(value: string) {
  return classes.find(c => c.value === value)?.name ?? value;
}
</script>

<template>
  <div class="ul-container">

    <span class="button-list">
      <button class="btn-secondary btn-with-badge" @click="openRequestsModal">
        Ver solicitudes
        <span v-if="store.pendingRequestsCount > 0" class="btn-badge">{{ store.pendingRequestsCount }}</span>
      </button>
      <button @click="openAddModal">Agregar miembro</button>
    </span>

    <div v-if="!loading && (allMembers.length || pendingInvitations.length)">
      <TableComponent :navItems="navItems">
        <ClanMemberCard
          v-for="{ char, role } in allMembers"
          :key="char._id"
          :char="char"
          :role="role"
          :clanId="clanId"
          :isLeader="isLeader"
          :isOfficer="isOfficer"
          @refresh="loadClan"
        />
        <PendingInvitationCard
          v-for="inv in pendingInvitations"
          :key="inv._id"
          :inv="inv"
          :clanId="clanId"
          @refresh="loadClan"
        />
      </TableComponent>
    </div>

    <div v-else-if="loading" class="skeleton-table-container">
      <div class="skeleton-table-header">
        <div v-for="n in 6" :key="n" class="skeleton-box skeleton-header-item"></div>
      </div>
      <div class="skeleton-table-row" v-for="n in 5" :key="n">
        <div v-for="i in 6" :key="i" class="skeleton-box skeleton-cell"></div>
      </div>
    </div>

    <p v-else-if="error">{{ error }}</p>
    <p v-else>No hay miembros en el clan.</p>

  </div>

  <!-- Modal: solicitudes de ingreso -->
  <CustomModal v-if="showRequestsModal" title="Solicitudes de ingreso" @close="showRequestsModal = false">
    <div class="modal-form">
      <p v-if="requestsLoading" class="modal-hint">Cargando solicitudes...</p>
      <p v-else-if="requestsError" class="modal-error">{{ requestsError }}</p>
      <p v-else-if="!clanRequests.length" class="modal-hint">No hay solicitudes pendientes.</p>
      <div v-for="req in clanRequests" :key="req._id" class="request-card">
        <div class="inv-char">
          <img v-if="req.character?.currentClass && getClassImage(req.character.currentClass)"
            :src="getClassImage(req.character.currentClass)"
            :alt="getClassName(req.character.currentClass)"
            width="28" />
          <i v-else class="fas fa-user-circle inv-placeholder"></i>
          <div class="inv-info">
            <strong>{{ req.character?.name ?? '—' }}</strong>
            <small>{{ req.user?.battletag ?? '—' }} · {{ req.character?.currentClass ? getClassName(req.character.currentClass) : 'Sin clase' }} · {{ req.character?.resonance ?? '—' }} res.</small>
          </div>
        </div>
        <div class="request-actions">
          <button
            class="btn-accept"
            :disabled="reviewingId === req._id"
            @click="handleReviewRequest(req._id, 'accept')"
          ><i class="fas fa-check"></i></button>
          <button
            class="btn-reject"
            :disabled="reviewingId === req._id"
            @click="handleReviewRequest(req._id, 'reject')"
          ><i class="fas fa-times"></i></button>
        </div>
      </div>
    </div>
  </CustomModal>

  <!-- Modal: agregar miembro -->
  <CustomModal v-if="showAddModal" title="Agregar miembro" @close="closeAddModal">
    <div class="modal-form">

      <!-- Step 1: buscar -->
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
              </div>
            </div>
          </li>
        </ul>

        <p v-if="addError" class="modal-error">{{ addError }}</p>
        <div class="step-actions">
          <button :disabled="searchName.trim().length < 2" @click="goToCreate">
            <i class="fas fa-plus"></i> Crear nuevo personaje
          </button>
        </div>
      </template>

      <!-- Step 2: confirmar / invitar -->
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

      <!-- Step 3: crear -->
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
