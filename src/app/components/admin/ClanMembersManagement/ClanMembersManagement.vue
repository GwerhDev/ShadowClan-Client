<style scoped lang="scss" src="./ClanMembersManagement.scss" />
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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
  bulkImportMembers,
  syncClanMembers,
  getClanMembersPage,
} from '../../../../middlewares/services';
import { getCharacterByName } from '../../../../middlewares/services/characterService';

const store: any = useStore();

const chars  = computed(() => store.currentUser.userData?.character ?? []);
const active = computed(() => (chars.value as any[]).find((c: any) => c._id === store.currentCharacter) ?? chars.value[0] ?? null);
const clanId = computed(() => active.value?.clan?._id ?? active.value?.clan ?? null);

const clan    = ref<any>(null);
const loading = ref(true);
const error   = ref<string | null>(null);

// ── Paginated members ──
const members        = ref<any[]>([]);
const membersPage    = ref(1);
const membersHasMore = ref(false);
const membersLoading = ref(false);
const membersTotal   = ref(0);
const searchQuery    = ref('');
const sentinel       = ref<HTMLElement | null>(null);
let   scrollObserver: IntersectionObserver | null = null;
let   searchDebounce: ReturnType<typeof setTimeout> | null = null;

const navItems = ['estado', 'nombre', 'rol', 'clase', 'puntaje', 'acciones'];

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

onMounted(() => {
  loadClan();
  scrollObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && membersHasMore.value && !membersLoading.value) {
      loadMembers(false);
    }
  }, { threshold: 0.1 });
});

onUnmounted(() => { scrollObserver?.disconnect(); });

watch(sentinel, (el) => {
  if (el && scrollObserver) scrollObserver.observe(el);
});

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => loadMembers(true), 500);
});

const pendingInvitations = ref<any[]>([]);

async function loadClan() {
  if (!clanId.value) return;
  loading.value = true;
  error.value   = null;
  try {
    const data = await getClanMembers(clanId.value);
    clan.value = data;
    pendingInvitations.value = data.pendingInvitations ?? [];
    await loadMembers(true);
  } catch {
    error.value = 'Error al cargar los miembros del clan.';
  } finally {
    loading.value = false;
  }
}

async function loadMembers(reset: boolean) {
  if (!clanId.value) return;
  if (membersLoading.value) return;
  if (reset) { membersPage.value = 1; members.value = []; membersHasMore.value = false; }
  membersLoading.value = true;
  try {
    const res = await getClanMembersPage(clanId.value, {
      page:  membersPage.value,
      limit: 20,
      q:     searchQuery.value || undefined,
    });
    members.value     = reset ? res.members : [...members.value, ...res.members];
    membersTotal.value = res.total;
    membersHasMore.value = res.hasMore;
    if (res.hasMore) membersPage.value++;
  } finally {
    membersLoading.value = false;
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
    clanRequests.value = await getClanRequestsManagement(active.value?._id);
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

// ── Sync modal ──
const showSyncModal   = ref(false);
const syncFile        = ref<File | null>(null);
const syncLoading     = ref(false);
const syncError       = ref('');
const syncResults     = ref<{ name: string; status: string }[]>([]);
const syncRemoved     = ref(0);
const syncDone        = ref(false);

function openSyncModal() {
  syncFile.value    = null;
  syncError.value   = '';
  syncResults.value = [];
  syncDone.value    = false;
  showSyncModal.value = true;
}

function onSyncFileChange(e: Event) {
  syncFile.value  = (e.target as HTMLInputElement).files?.[0] ?? null;
  syncError.value = '';
  syncDone.value  = false;
}

async function handleSync() {
  if (!syncFile.value) return;
  syncLoading.value = true;
  syncError.value   = '';
  syncDone.value    = false;
  try {
    const res = await syncClanMembers(clanId.value, syncFile.value);
    syncResults.value = res.results ?? [];
    syncRemoved.value = res.removed ?? 0;
    syncDone.value    = true;
  } catch (e: any) {
    const data = e?.response?.data;
    syncError.value = data?.message ?? data?.details ?? data?.error ?? 'Error al sincronizar.';
  } finally {
    syncLoading.value = false;
    await loadClan();
  }
}

// ── Step 4: bulk import ──
const importFile      = ref<File | null>(null);
const importLoading   = ref(false);
const importError     = ref('');
const importResults   = ref<{ name: string; status: string; reason?: string }[]>([]);
const importDone      = ref(false);

function goToImport() {
  importFile.value    = null;
  importError.value   = '';
  importResults.value = [];
  importDone.value    = false;
  addStep.value       = 4 as any;
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
    const res = await bulkImportMembers(clanId.value, importFile.value);
    importResults.value = res.results ?? [];
    importDone.value    = true;
    await loadClan();
  } catch (e: any) {
    importError.value = e?.response?.data?.message ?? 'Error al importar el archivo.';
  } finally {
    importLoading.value = false;
  }
}

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

    <div class="mgmt-toolbar">
      <div class="search-bar">
        <div class="search-wrap">
          <i class="fas fa-magnifying-glass search-icon"></i>
          <input v-model="searchQuery" class="search-input" placeholder="Buscar por nombre..." />
          <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''" title="Limpiar">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
        <span v-if="membersTotal > 0" class="members-count">
          <i class="fas fa-users"></i> {{ membersTotal }}
        </span>
      </div>

      <span class="button-list">
        <button class="btn-secondary btn-with-badge" @click="openRequestsModal">
          <i class="fas fa-inbox"></i> Ver solicitudes
          <span v-if="store.pendingRequestsCount > 0" class="btn-badge">{{ store.pendingRequestsCount }}</span>
        </button>
        <button class="btn-secondary" @click="openSyncModal">
          <i class="fas fa-rotate"></i> Actualizar
        </button>
        <button @click="openAddModal">
          <i class="fas fa-user-plus"></i> Agregar miembro
        </button>
      </span>
    </div>

    <div v-if="!loading">
      <TableComponent
        v-if="members.length || pendingInvitations.length || membersLoading"
        :navItems="navItems"
      >
        <ClanMemberCard
          v-for="m in members"
          :key="m._id"
          :char="m"
          :role="m.role"
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
        <div
          v-if="membersLoading"
          v-for="n in 5"
          :key="'sk' + n"
          class="member-skeleton-row"
        >
          <span v-for="c in 6" :key="c" class="skeleton-box skeleton-cell"></span>
        </div>
      </TableComponent>

      <p v-else-if="!membersLoading && searchQuery" class="empty-search">Sin resultados para "{{ searchQuery }}".</p>

      <div ref="sentinel" class="sentinel"></div>
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

  <!-- Modal: sincronizar desde archivo -->
  <CustomModal v-if="showSyncModal" title="Actualizar clan desde archivo" @close="showSyncModal = false">
    <div class="modal-form">
      <p class="modal-hint">
        El archivo reemplaza los <strong>miembros</strong> del clan. Los personajes del archivo son creados o actualizados; los que no aparezcan son eliminados del clan.<br />
        Columnas: <strong>Jugador, Resonancia, Armadura, Penetracion, Potencia, Resistencia, Clase, Whatsapp</strong>.
      </p>
      <div class="field-group">
        <label class="field-label">Archivo (.csv o .xlsx)</label>
        <input type="file" accept=".csv,.xlsx" class="sync-file-input" @change="onSyncFileChange" :disabled="syncLoading" />
      </div>
      <div class="step-actions">
        <button :disabled="syncLoading || !syncFile" @click="handleSync">
          <i class="fas fa-rotate"></i>
          {{ syncLoading ? 'Sincronizando...' : 'Sincronizar' }}
        </button>
      </div>
      <p v-if="syncError" class="modal-error">{{ syncError }}</p>
      <template v-if="syncDone">
        <p class="modal-hint">
          {{ syncResults.length }} procesados
          <span v-if="syncRemoved > 0"> · {{ syncRemoved }} eliminados del clan</span>
        </p>
        <ul class="search-results">
          <li v-for="r in syncResults" :key="r.name" class="search-result-card" style="cursor:default">
            <div class="result-info">
              <div>
                <strong>{{ r.name }}</strong>
                <small>{{ r.status === 'created' ? 'Creado' : 'Actualizado' }}</small>
              </div>
            </div>
          </li>
        </ul>
      </template>
    </div>
  </CustomModal>

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
          <button @click="goToImport">
            <i class="fas fa-file-import"></i> Importar CSV / XLSX
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

      <!-- Step 4: importar CSV / XLSX -->
      <template v-if="(addStep as any) === 4">
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
