<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from '../../../middlewares/store';
import SearchSelector from '../Selectors/SearchSelector.vue';
import LinkCharacterForm from './LinkCharacterForm.vue';
import { Clan } from '../../../interfaces';
import { API_URL } from '../../../middlewares/misc/const';
import axios from 'axios';

const store: any = useStore();

const linkingCharacter = ref(false);
const clans = ref<Clan[]>([]);
const selectedClanId = ref('');
const submitting = ref(false);
const requestStatus = ref<'idle' | 'success' | 'conflict' | 'error'>('idle');
const myRequests = ref<any[]>([]);

const activeCharacter = computed(() => {
  const chars = store.currentUser.userData?.character;
  if (!chars?.length) return null;
  return chars.find((c: any) => c._id === store.currentCharacter) ?? chars[0];
});

const hasPendingRequest = computed(() =>
  myRequests.value.some((r: any) => r.status === 'pending')
);

const statusLabel = (s: string) => {
  if (s === 'pending')  return 'Pendiente';
  if (s === 'accepted') return 'Aceptada';
  return 'Rechazada';
};

async function fetchClans() {
  const res = await axios.get(API_URL + '/clan', { withCredentials: true });
  clans.value = res.data;
}

async function fetchMyRequests() {
  myRequests.value = await store.handleGetClanRequests() ?? [];
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

onMounted(() => Promise.all([fetchClans(), fetchMyRequests()]));
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
      <template v-if="!linkingCharacter">
        <div class="onboarding-icon-wrap">
          <i class="fas fa-khanda"></i>
        </div>
        <h2>Tu aventura comienza aquí</h2>
        <p class="muted">
          Vincula tu personaje de Diablo Immortal para acceder a todas las funciones de gestión de clan.
        </p>
        <div class="onboarding-features">
          <div class="onboarding-feature">
            <i class="fas fa-khanda"></i>
            <div>
              <strong>Guerra Sombría</strong>
              <span>Registra tus batallas y sigue el progreso de tu clan en cada guerra.</span>
            </div>
          </div>
          <div class="onboarding-feature">
            <i class="fas fa-chess-rook"></i>
            <div>
              <strong>Torre Maldita</strong>
              <span>Coordina asaltos de conquista territorial con tu clan y aliados.</span>
            </div>
          </div>
          <div class="onboarding-feature">
            <i class="fas fa-tasks"></i>
            <div>
              <strong>Tareas del Clan</strong>
              <span>Gestiona y completa las tareas diarias asignadas a tu personaje.</span>
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
        @done="linkingCharacter = false"
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

      <!-- Solicitudes enviadas -->
      <div v-if="myRequests.length" class="requests-section">
        <h4>solicitudes enviadas</h4>
        <div class="request-row" v-for="req in myRequests" :key="req._id">
          <span class="request-clan">{{ req.clan?.name }}</span>
          <span :class="['request-status', req.status]">{{ statusLabel(req.status) }}</span>
        </div>
      </div>

      <!-- Pendiente: mensaje de espera -->
      <div v-if="hasPendingRequest" class="pending-notice">
        <i class="fas fa-clock"></i>
        <p>Tu solicitud está siendo revisada. Serás notificado cuando haya una respuesta.</p>
      </div>

      <!-- Búsqueda y envío -->
      <template v-else>
        <div class="search-section">
          <h4>unirse a un clan</h4>
          <SearchSelector
            v-model="selectedClanId"
            :options="clans"
            placeholder="Buscar clan..."
          />
          <button
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
  padding: 2rem 1.5rem;
  max-width: 620px;
  width: 100%;
  margin: 0 auto;
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
    padding: .55rem .85rem;
    background: rgba(255, 255, 255, .03);
    border: 1px solid rgba(255,255,255,.05);
    border-radius: 6px;
  }

  .request-clan { font-size: .88rem; }

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
