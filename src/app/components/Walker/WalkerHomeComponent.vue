<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from '../../../middlewares/store';
import SearchSelector from '../Selectors/SearchSelector.vue';
import LinkCharacterForm from './LinkCharacterForm.vue';
import { getMyCharacterClaims, getMyCharacterCreationRequests, searchClans, createClanCreationRequest, getMyClanCreationRequests, cancelClanRequest } from '../../../middlewares/services';
import { getSocket } from '../../../middlewares/socket';
const store: any = useStore();

const linkingCharacter = ref(false);
const selectedClanId = ref('');

const submitting      = ref(false);
const requestStatus   = ref<'idle' | 'success' | 'conflict' | 'error'>('idle');
const cancellingId    = ref<string | null>(null);
const myRequests      = ref<any[]>([]);
const pendingCharacterRequests = ref<any[]>([]);

// Clan creation request
const showClanCreationForm = ref(false);
const newClanName           = ref('');
const clanCreationSubmitting = ref(false);
const clanCreationStatus    = ref<'idle' | 'success' | 'conflict' | 'error'>('idle');
const pendingClanRequests   = ref<any[]>([]);

const activeCharacter = computed(() => {
  const chars = store.currentUser.userData?.character;
  if (!chars?.length) return null;
  return chars.find((c: any) => c._id === store.currentCharacter) ?? chars[0];
});

const pendingRequests = computed(() =>
  myRequests.value.filter((r: any) => r.status === 'pending')
);

async function fetchMyRequests() {
  myRequests.value = await store.handleGetClanRequests() ?? [];
}

async function handleCancelRequest(id: string) {
  cancellingId.value = id;
  try {
    await cancelClanRequest(id);
    myRequests.value = myRequests.value.filter((r: any) => r._id !== id);
    if (store.pendingRequestsCount > 0) store.pendingRequestsCount--;
  } finally {
    cancellingId.value = null;
  }
}

async function fetchClanCreationRequests() {
  try {
    const all = await getMyClanCreationRequests();
    pendingClanRequests.value = (all as any[]).filter(r => r.status === 'pending');
  } catch { pendingClanRequests.value = []; }
}

async function submitClanCreationRequest() {
  if (!newClanName.value.trim() || !activeCharacter.value) return;
  clanCreationSubmitting.value = true;
  clanCreationStatus.value = 'idle';
  try {
    await createClanCreationRequest(newClanName.value.trim(), activeCharacter.value._id);
    clanCreationStatus.value = 'success';
    newClanName.value = '';
    showClanCreationForm.value = false;
    await fetchClanCreationRequests();
  } catch (e: any) {
    clanCreationStatus.value = e?.response?.status === 409 ? 'conflict' : 'error';
  } finally {
    clanCreationSubmitting.value = false;
  }
}

async function sendRequest() {
  if (!selectedClanId.value || !activeCharacter.value) return;
  submitting.value = true;
  requestStatus.value = 'idle';
  try {
    await store.handleCreateClanRequest(activeCharacter.value._id, selectedClanId.value);
    requestStatus.value = 'success';
    selectedClanId.value = '';
    await fetchMyRequests();
  } catch (e: any) {
    requestStatus.value = e?.response?.status === 409 ? 'conflict' : 'error';
  } finally {
    submitting.value = false;
  }
}

function handleReviewed(data: any) {
  if (data.action === 'reject') {
    myRequests.value = myRequests.value.filter((r: any) => r._id !== data.id);
  }
}

function handleCharacterReviewed(data: any) {
  if (data.action === 'reject') {
    pendingCharacterRequests.value = pendingCharacterRequests.value.filter((r: any) => r._id !== data.id);
  }
}

async function fetchPendingCharacterRequests() {
  const [claims, creations] = await Promise.all([
    getMyCharacterClaims().catch(() => []),
    getMyCharacterCreationRequests().catch(() => []),
  ]);
  pendingCharacterRequests.value = [
    ...(claims as any[]).filter((r: any) => r.status === 'pending').map((r: any) => ({ ...r, _kind: 'claim' })),
    ...(creations as any[]).filter((r: any) => r.status === 'pending').map((r: any) => ({ ...r, _kind: 'creation' })),
  ];
}

async function handleClanCreationReviewed(data: any) {
  if (data.action === 'accept') {
    // Refresh user data so the clan appears and the UI transitions out of walker view
    await store.handleUserData();
  } else {
    pendingClanRequests.value = pendingClanRequests.value.filter((r: any) => r._id !== data.id);
  }
}

onMounted(async () => {
  await Promise.all([fetchMyRequests(), fetchPendingCharacterRequests(), fetchClanCreationRequests()]);
  const socket = getSocket();
  socket?.on('clan-request:reviewed', handleReviewed);
  socket?.on('character-request:reviewed', handleCharacterReviewed);
  socket?.on('clan-creation-request:reviewed', handleClanCreationReviewed);
});

onUnmounted(() => {
  const socket = getSocket();
  socket?.off('clan-request:reviewed', handleReviewed);
  socket?.off('character-request:reviewed', handleCharacterReviewed);
  socket?.off('clan-creation-request:reviewed', handleClanCreationReviewed);
});
</script>

<template>
  <div class="walker-home">
    <div class="walker-header">
      <h4>estado actual</h4>
      <h1>Caminante</h1>
      <p class="walker-subtitle" v-if="!store.currentUser.userData?.character?.length">
        Vincula tu personaje de Diablo Immortal para comenzar.
      </p>
      <p class="walker-subtitle" v-else>
        Aún no formas parte de ningún clan. Busca uno y envía una solicitud para unirte.
      </p>
    </div>

    <!-- Sin personaje vinculado -->
    <div v-if="!store.currentUser.userData?.character?.length" class="walker-card">

      <!-- Solicitudes de personaje pendientes -->
      <template v-if="pendingCharacterRequests.length && !linkingCharacter">
        <div class="requests-section" style="align-self: stretch; text-align: left;">
          <h4>solicitudes de personaje</h4>
          <div class="request-row" v-for="req in pendingCharacterRequests" :key="req._id">
            <span class="request-clan">{{ req.character?.name ?? req.name ?? '—' }}</span>
            <span class="request-type">{{ req._kind === 'claim' ? 'Reclamación' : 'Creación' }}</span>
            <span class="request-status pending">Pendiente</span>
          </div>
        </div>
        <div class="pending-notice" style="align-self: stretch; text-align: left;">
          <i class="fas fa-clock"></i>
          <p>Tu solicitud de personaje está siendo revisada. Serás notificado cuando haya una respuesta.</p>
        </div>
      </template>

      <template v-if="!linkingCharacter">
        <div class="onboarding-icon-wrap">
          <i class="fas fa-khanda"></i>
        </div>
        <h2>Tu aventura comienza aquí</h2>
        <p class="muted">
          Vincula tu personaje de Diablo Immortal para comenzar. Una vez vinculado, podrás acceder a tus tareas personales y solicitar unirte a un clan.
        </p>
        <div class="onboarding-features">
          <div class="onboarding-feature">
            <i class="fas fa-tasks"></i>
            <div>
              <strong>Tareas personales</strong>
              <span>Con tu personaje vinculado puedes gestionar y completar tus tareas diarias.</span>
            </div>
          </div>
          <div class="onboarding-feature">
            <i class="fas fa-shield-halved"></i>
            <div>
              <strong>Únete a un clan</strong>
              <span>Al formar parte de un clan desbloqueas la Guerra Sombría, la Torre Maldita y las tareas del clan.</span>
            </div>
          </div>
        </div>
        <button class="submit-btn" @click="linkingCharacter = true">
          <i class="fas fa-plus"></i>
          Vincular personaje
        </button>
      </template>
      <LinkCharacterForm
        v-else
        @done="() => { linkingCharacter = false; fetchPendingCharacterRequests(); }"
        @cancel="linkingCharacter = false"
      />
    </div>

    <!-- Con personaje -->
    <div v-else class="walker-card">

      <!-- Personaje activo -->
      <div class="active-character">
        <i class="fa-solid fa-shield-halved"></i>
        <span>Personaje activo: <span class="featured-text">{{ activeCharacter?.name ?? '—' }}</span></span>
      </div>

      <!-- Solicitudes enviadas (solo pendientes) -->
      <div v-if="pendingRequests.length" class="requests-section">
        <h4>solicitudes enviadas</h4>
        <div class="request-row" v-for="req in pendingRequests" :key="req._id">
          <span class="request-clan">{{ req.clan?.name }}</span>
          <span class="request-status pending">Pendiente</span>
          <button
            class="request-cancel-btn"
            :disabled="cancellingId === req._id"
            @click="handleCancelRequest(req._id)"
            title="Cancelar solicitud"
          >
            <i :class="cancellingId === req._id ? 'fas fa-spinner fa-spin' : 'fas fa-times'"></i>
          </button>
        </div>
      </div>

      <!-- Pendiente: mensaje de espera -->
      <div v-if="pendingRequests.length" class="pending-notice">
        <i class="fas fa-clock"></i>
        <p>Tu solicitud está siendo revisada. Serás notificado cuando haya una respuesta.</p>
      </div>

      <!-- Búsqueda y envío -->
      <template v-else>
        <div class="search-section">
          <h4>unirse a un clan</h4>

          <!-- Pending clan creation request -->
          <div v-if="pendingClanRequests.length" class="pending-notice">
            <i class="fas fa-clock"></i>
            <p>Tu solicitud para crear el clan <strong>{{ pendingClanRequests[0].clanName }}</strong> está siendo revisada por los administradores.</p>
          </div>

          <template v-else>
            <!-- Clan search (hidden when creation form is open) -->
            <SearchSelector
              v-if="!showClanCreationForm"
              v-model="selectedClanId"
              :fetch-fn="searchClans"
              placeholder="Buscar clan..."
              create-label="Solicitar creación de clan"
              @create="(q) => { newClanName = q ?? ''; showClanCreationForm = true; clanCreationStatus = 'idle'; selectedClanId = ''; }"
            />

            <!-- Clan creation inline form (replaces selector) -->
            <div v-if="showClanCreationForm" class="clan-creation-form">
              <p class="clan-creation-hint">
                <i class="fas fa-info-circle"></i>
                Tu solicitud será revisada por los administradores.
              </p>
              <input
                v-model="newClanName"
                class="clan-creation-input"
                placeholder="Nombre del clan..."
                @keyup.enter="submitClanCreationRequest"
                :disabled="clanCreationSubmitting"
              />
              <div class="clan-creation-actions">
                <button class="submit-btn" :disabled="!newClanName.trim() || clanCreationSubmitting" @click="submitClanCreationRequest">
                  <i class="fas fa-paper-plane"></i>
                  {{ clanCreationSubmitting ? 'Enviando...' : 'Solicitar' }}
                </button>
                <button class="submit-btn submit-btn--ghost" @click="showClanCreationForm = false; newClanName = ''">
                  Cancelar
                </button>
              </div>
              <p v-if="clanCreationStatus === 'conflict'" class="feedback warning">Ya tienes una solicitud de clan pendiente.</p>
              <p v-if="clanCreationStatus === 'error'"    class="feedback error">Error al enviar la solicitud.</p>
            </div>

            <!-- Join request -->
            <button
              v-if="!showClanCreationForm"
              class="submit-btn"
              :disabled="!selectedClanId || submitting"
              @click="sendRequest"
            >
              <i class="fas fa-paper-plane"></i>
              {{ submitting ? 'Enviando...' : 'Enviar solicitud' }}
            </button>

            <p v-if="requestStatus === 'success'"  class="feedback success">Solicitud enviada correctamente.</p>
            <p v-if="requestStatus === 'conflict'" class="feedback warning">Ya tienes una solicitud pendiente para este clan.</p>
            <p v-if="requestStatus === 'error'"    class="feedback error">Error al enviar la solicitud. Intenta de nuevo.</p>
          </template>
        </div>
      </template>

    </div>
  </div>


</template>

<style scoped lang="scss">
$gold: rgb(227, 210, 168);
$gold-dim: rgba(227, 210, 168, .15);
$gold-mid: rgba(227, 210, 168, .5);

.walker-home {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}

/* ── Header ── */
.walker-header {
  display: flex;
  flex-direction: column;
  gap: .3rem;
  align-items: center;
  text-align: center;

  h4 {
    font-size: .7rem;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: rgba(255,255,255,.4);
    margin: 0;
  }

  h1 {
    margin: 0;
    line-height: 1.1;
  }
}

.walker-subtitle {
  margin: .5rem 0 0;
  font-size: .9rem;
  color: rgba(255, 255, 255, .5);
  line-height: 1.65;
  max-width: 480px;
  text-align: center;
}

/* ── Card ── */
.walker-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
  background: rgba(255, 255, 255, .03);
  border: 1px solid $gold-dim;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 0 24px rgba(0, 0, 0, .35);
}

.walker-icon {
  font-size: 2rem;
  color: $gold;
  opacity: .6;
}

.no-char-state h2 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--color-app-white);
}

.muted {
  color: rgba(255, 255, 255, .45);
  font-size: .85rem;
  line-height: 1.65;
  margin: 0;
}

/* ── Botones temáticos ── */
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .55rem 1.2rem;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-size: .8rem;
  letter-spacing: .05em;
  background: transparent;
  border: 1px solid $gold-mid;
  color: $gold;
  cursor: pointer;
  transition: background .2s, border-color .2s;

  &:hover {
    background: rgba(227, 210, 168, .08);
    border-color: $gold;
  }

  &:disabled {
    opacity: .35;
    cursor: not-allowed;
  }
}

/* ── Con personaje: vuelve a alinear izquierda ── */
.active-character,
.requests-section,
.pending-notice,
.search-section {
  text-align: left;
  align-self: stretch;
}

/* ── Personaje activo ── */
.active-character {
  display: flex;
  align-items: center;
  gap: .75rem;
  font-size: .88rem;
  color: rgba(255, 255, 255, .7);
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255,255,255,.06);

  i { color: $gold; font-size: 1rem; }
}

/* ── Solicitudes ── */
.requests-section {
  display: flex;
  flex-direction: column;
  gap: .5rem;

  h4 {
    font-size: .65rem;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: rgba(255,255,255,.35);
    margin: 0 0 .25rem;
  }

  .request-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: .65rem;
    padding: .55rem .85rem;
    background: rgba(255, 255, 255, .03);
    border: 1px solid rgba(255,255,255,.05);
    border-radius: 6px;
  }

  .request-clan { font-size: .88rem; flex: 1; }

  .request-cancel-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: transparent;
    border: 1px solid rgba(229, 115, 115, .25);
    color: rgba(229, 115, 115, .6);
    cursor: pointer;
    font-size: .7rem;
    flex-shrink: 0;
    transition: background .15s, color .15s, border-color .15s;

    &:hover:not(:disabled) {
      background: rgba(229, 115, 115, .1);
      border-color: rgba(229, 115, 115, .5);
      color: rgb(229, 115, 115);
    }

    &:disabled { opacity: .4; cursor: not-allowed; }
  }

  .request-type {
    font-size: .7rem;
    color: rgba(255, 255, 255, .35);
    font-family: 'Cinzel', serif;
    text-transform: uppercase;
    letter-spacing: .05em;
  }

  .request-status {
    font-size: .7rem;
    font-family: 'Cinzel', serif;
    text-transform: uppercase;
    letter-spacing: .06em;

    &.pending  { color: $gold; }
    &.accepted { color: #81c784; }
    &.rejected { color: #e57373; }
  }
}

/* ── Pendiente ── */
.pending-notice {
  display: flex;
  align-items: flex-start;
  gap: .9rem;
  padding: 1rem 1.1rem;
  background: rgba(227, 210, 168, .05);
  border: 1px solid $gold-dim;
  border-radius: 8px;
  color: rgba(255, 255, 255, .6);
  font-size: .875rem;
  line-height: 1.6;

  i { color: $gold; margin-top: 2px; flex-shrink: 0; }
  p { margin: 0; }
}

/* ── Búsqueda ── */
.search-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  h4 {
    font-size: .65rem;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: rgba(255,255,255,.35);
    margin: 0;
  }
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .55rem 1.2rem;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-size: .8rem;
  letter-spacing: .05em;
  background: transparent;
  border: 1px solid $gold-mid;
  color: $gold;
  cursor: pointer;
  transition: background .2s, border-color .2s;

  &:hover {
    background: rgba(227, 210, 168, .08);
    border-color: $gold;
  }

  &:disabled {
    opacity: .35;
    cursor: not-allowed;
  }
}

/* ── Clan creation form ── */
.clan-creation-form {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  padding: 1rem;
  background: rgba(227, 210, 168, .04);
  border: 1px solid $gold-dim;
  border-radius: 8px;
}

.clan-creation-hint {
  margin: 0;
  font-size: .8rem;
  color: rgba(255, 255, 255, .4);
  display: flex;
  align-items: center;
  gap: .5rem;
  i { color: $gold; }
}

.clan-creation-input {
  width: 100%;
  height: 34px;
  padding: 0 .75rem;
  background: rgba(255, 255, 255, .05);
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 6px;
  color: rgba(255, 255, 255, .85);
  font-size: .85rem;
  box-sizing: border-box;
  font-family: 'Cinzel', serif;

  &:focus { outline: none; border-color: $gold-mid; }
  &::placeholder { color: rgba(255, 255, 255, .25); }
  &:disabled { opacity: .5; }
}

.clan-creation-actions {
  display: flex;
  gap: .5rem;
}

.submit-btn--ghost {
  border-color: rgba(255, 255, 255, .15);
  color: rgba(255, 255, 255, .4);

  &:hover {
    background: rgba(255, 255, 255, .06);
    border-color: rgba(255, 255, 255, .3);
    color: rgba(255, 255, 255, .7);
  }
}

/* ── Feedback ── */
.feedback {
  margin: 0;
  font-size: .82rem;

  &.success { color: #81c784; }
  &.warning { color: $gold; }
  &.error   { color: #e57373; }
}

/* ── Onboarding (no character) ── */
.onboarding-icon-wrap {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(180, 40, 40, 0.1);
  border: 1px solid rgba(180, 40, 40, 0.25);

  i {
    font-size: 1.7rem;
    color: rgba(210, 80, 80, 0.85);
    filter: drop-shadow(0 0 8px rgba(200, 40, 40, 0.45));
  }
}

.onboarding-features {
  display: flex;
  flex-direction: column;
  gap: .6rem;
  width: 100%;
  text-align: left;
}

.onboarding-feature {
  display: flex;
  align-items: flex-start;
  gap: .9rem;
  padding: .75rem 1rem;
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .06);
  border-radius: 8px;

  > i {
    font-size: .9rem;
    color: $gold-mid;
    margin-top: 3px;
    flex-shrink: 0;
  }

  > div {
    display: flex;
    flex-direction: column;
    gap: .2rem;

    strong {
      font-family: 'Cinzel', serif;
      font-size: .78rem;
      color: rgba(227, 210, 168, 0.85);
    }

    span {
      font-size: .78rem;
      color: rgba(255, 255, 255, .38);
      line-height: 1.45;
    }
  }
}

</style>
