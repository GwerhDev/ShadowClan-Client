<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useStore } from '../../middlewares/store';
import { getClanInvitations, reviewClanInvitation, confirmShadowWar } from '../../middlewares/services';
import { classes } from '../../middlewares/misc/const';
import AppLayout from '../layouts/AppLayout.vue';

const store: any = useStore();

const invitations = ref<any[]>([]);
const loading = ref(true);
const selected = ref<{ type: string; raw: any } | null>(null);
const processingId = ref<string | null>(null);
const actionError = ref('');
const showDetail = ref(false);

const visibleInvitations = computed(() => invitations.value);

const reviewedRequests = computed(() =>
  (store.notifications as any[])
    .filter((n: any) => n.type === 'clan-request-reviewed' && String(n.targetId) === String(store.currentCharacter))
    .map((n: any) => ({ type: 'clan-request-reviewed', raw: { ...n.data, _notifId: n.id } }))
);

const reviewedCharacterRequests = computed(() =>
  (store.notifications as any[])
    .filter((n: any) => n.type === 'character-request-reviewed')
    .map((n: any) => ({ type: 'character-request-reviewed', raw: { ...n.data, _notifId: n.id } }))
);

const shadowWarAssignments = computed(() =>
  (store.notifications as any[])
    .filter((n: any) => n.type === 'shadowwar-assignment' && String(n.targetId) === String(store.currentCharacter))
    .map((n: any) => ({ type: 'shadowwar-assignment', raw: { ...n.data, _notifId: n.id } }))
);

const allItems = computed(() => [
  ...visibleInvitations.value.map(inv => ({ type: 'clan-invitation', raw: inv })),
  ...reviewedRequests.value,
  ...reviewedCharacterRequests.value,
  ...shadowWarAssignments.value,
]);

watch(
  () => store.currentCharacter,
  async (charId) => {
    selected.value = null;
    showDetail.value = false;
    invitations.value = [];
    if (!charId) return;
    loading.value = true;
    try {
      invitations.value = await getClanInvitations(charId) ?? [];
    } catch {
      invitations.value = [];
    } finally {
      loading.value = false;
    }
  },
  { immediate: true }
);

function selectItem(item: { type: string; raw: any }) {
  selected.value = item;
  actionError.value = '';
  showDetail.value = true;
}

function backToList() {
  showDetail.value = false;
}

async function reviewInvitation(id: string, action: 'accept' | 'reject') {
  processingId.value = id;
  actionError.value = '';
  try {
    await reviewClanInvitation(id, action);
    await store.handleGetCharacter();
    invitations.value = invitations.value.filter(i => i._id !== id);
    store.decrementPendingInboxCount();
    const notif = store.notifications.find((n: any) => n.type === 'clan-invitation' && n.data?.id === id);
    if (notif) notif.read = true;
    selected.value = null;
    showDetail.value = false;
  } catch (e: any) {
    actionError.value = e?.response?.data?.message ?? 'Error al procesar la invitación.';
  } finally {
    processingId.value = null;
  }
}

function getClassName(value: string) {
  return classes.find(c => c.value === value)?.name ?? value;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function itemTitle(item: { type: string; raw: any }): string {
  if (item.type === 'clan-invitation') return item.raw.clan?.name ?? '—';
  if (item.type === 'clan-request-reviewed') return item.raw.clan?.name ?? '—';
  if (item.type === 'character-request-reviewed') return item.raw.character?.name ?? '—';
  if (item.type === 'shadowwar-assignment') return item.raw.characterName ?? '—';
  return '—';
}

function itemSubtitle(item: { type: string; raw: any }): string {
  if (item.type === 'clan-invitation') return 'Invitación de clan';
  if (item.type === 'clan-request-reviewed')
    return item.raw.action === 'accept' ? 'Solicitud aceptada' : 'Solicitud rechazada';
  if (item.type === 'character-request-reviewed') {
    const label = item.raw.type === 'claim' ? 'Reclamación' : 'Creación';
    return item.raw.action === 'accept' ? `${label} aprobada` : `${label} rechazada`;
  }
  if (item.type === 'shadowwar-assignment') return 'Asignación — Guerra Sombría';
  return '—';
}

async function confirmWarAssignment(item: { type: string; raw: any }) {
  processingId.value = item.raw._notifId;
  actionError.value = '';
  try {
    await confirmShadowWar(item.raw.shadowWarId);
    await store.handleGetNextShadowWar();
    const notif = (store.notifications as any[]).find((n: any) => n.id === item.raw._notifId);
    if (notif) { notif.read = true; }
    store.decrementPendingInboxCount();
    selected.value = null;
    showDetail.value = false;
  } catch (e: any) {
    actionError.value = e?.response?.data?.message ?? 'Error al confirmar la participación.';
  } finally {
    processingId.value = null;
  }
}

function dismissReviewedRequest(notifId: string) {
  const notif = (store.notifications as any[]).find((n: any) => n.id === notifId);
  if (notif && !notif.read) {
    notif.read = true;
    store.decrementPendingInboxCount();
  }
  selected.value = null;
  showDetail.value = false;
}
</script>

<template>
  <main class="red-shadow-fx">
    <div class="req-page-container">
      <AppLayout :tabs="[]" hideTitle>
        <div class="req-layout" :class="{ 'show-detail': showDetail }">

          <!-- LEFT: lista -->
          <aside class="req-sidebar">
            <div class="req-sidebar-header">
<h2 class="req-sidebar-title">Misivas</h2>
            </div>

            <div v-if="loading" class="req-empty">Cargando...</div>

            <div v-else-if="!allItems.length" class="req-empty">
              <i class="fas fa-scroll"></i>
              <p>Sin misivas pendientes.</p>
            </div>

            <ul v-else class="req-list">
              <li
                v-for="(item, i) in allItems"
                :key="item.raw._id ?? i"
                class="req-item"
                :class="{ active: selected?.raw._id === item.raw._id }"
                @click="selectItem(item)"
              >
                <div class="req-item-icon-wrap" :class="item.type">
                  <i :class="
                    item.type === 'clan-invitation'           ? 'fas fa-envelope'
                    : item.type === 'clan-request-reviewed'  ? (item.raw.action === 'accept' ? 'fas fa-check' : 'fas fa-times')
                    : item.type === 'shadowwar-assignment'   ? 'fas fa-sword'
                    : item.raw.action === 'accept'           ? 'fas fa-user-check' : 'fas fa-user-times'
                  "></i>
                </div>
                <div class="req-item-body">
                  <span class="req-item-title">{{ itemTitle(item) }}</span>
                  <span class="req-item-sub">{{ itemSubtitle(item) }}</span>
                </div>
                <span class="req-item-date">{{ formatDate(item.raw.createdAt) }}</span>
              </li>
            </ul>
          </aside>

          <!-- RIGHT: detalle -->
          <div class="req-detail">
            <button class="req-back-btn" @click="backToList">
              <i class="fas fa-arrow-left"></i> Volver
            </button>

            <div v-if="!selected" class="req-detail-empty">
              <i class="fas fa-scroll"></i>
              <p>Selecciona una misiva para ver el detalle.</p>
            </div>

            <template v-else-if="selected.type === 'clan-invitation'">
              <div class="req-detail-content">
                <div class="req-detail-header">
                  <div class="req-detail-type invitation">
                    <i class="fas fa-envelope"></i>
                    <span>Invitación de clan</span>
                  </div>
                  <span class="req-detail-date">{{ formatDate(selected.raw.createdAt) }}</span>
                </div>

                <div class="req-detail-clan">
                  <i class="fas fa-shield-halved req-clan-icon"></i>
                  <div>
                    <h2 class="req-clan-name">{{ selected.raw.clan?.name ?? '—' }}</h2>
                    <p class="req-clan-sub">te invita a unirte al clan</p>
                  </div>
                </div>

                <div class="req-detail-grid">
                  <div class="req-detail-item">
                    <span class="req-detail-label">Personaje</span>
                    <span class="req-detail-value">{{ selected.raw.character?.name ?? '—' }}</span>
                  </div>
                  <div class="req-detail-item">
                    <span class="req-detail-label">Rol ofrecido</span>
                    <span class="req-detail-value req-role" :class="selected.raw.role">
                      {{ selected.raw.role === 'officer' ? 'Oficial' : 'Miembro' }}
                    </span>
                  </div>
                  <div v-if="selected.raw.proposedClass" class="req-detail-item">
                    <span class="req-detail-label">Clase propuesta</span>
                    <span class="req-detail-value">{{ getClassName(selected.raw.proposedClass) }}</span>
                  </div>
                  <div v-if="selected.raw.proposedResonance" class="req-detail-item">
                    <span class="req-detail-label">Resonancia propuesta</span>
                    <span class="req-detail-value">{{ selected.raw.proposedResonance }}</span>
                  </div>
                </div>

                <p v-if="actionError" class="req-error">{{ actionError }}</p>

                <div class="req-detail-actions">
                  <button class="req-btn accept" :disabled="processingId === selected.raw._id" @click="reviewInvitation(selected.raw._id, 'accept')">
                    <i class="fas fa-check"></i> Aceptar invitación
                  </button>
                  <button class="req-btn reject" :disabled="processingId === selected.raw._id" @click="reviewInvitation(selected.raw._id, 'reject')">
                    <i class="fas fa-times"></i> Rechazar
                  </button>
                </div>
              </div>
            </template>

            <template v-else-if="selected.type === 'clan-request-reviewed'">
              <div class="req-detail-content">
                <div class="req-detail-header">
                  <div class="req-detail-type" :class="selected.raw.action === 'accept' ? 'accepted' : 'rejected'">
                    <i :class="selected.raw.action === 'accept' ? 'fas fa-check' : 'fas fa-times'"></i>
                    <span>{{ selected.raw.action === 'accept' ? 'Solicitud aceptada' : 'Solicitud rechazada' }}</span>
                  </div>
                  <span class="req-detail-date">{{ formatDate(selected.raw.createdAt) }}</span>
                </div>

                <div class="req-detail-clan">
                  <i class="fas fa-shield-halved req-clan-icon"></i>
                  <div>
                    <h2 class="req-clan-name">{{ selected.raw.clan?.name ?? '—' }}</h2>
                    <p class="req-clan-sub">
                      {{ selected.raw.action === 'accept'
                        ? 'ha aceptado tu solicitud de ingreso'
                        : 'ha rechazado tu solicitud de ingreso' }}
                    </p>
                  </div>
                </div>

                <div class="req-detail-actions">
                  <button class="req-btn ghost" @click="dismissReviewedRequest(selected.raw._notifId)">
                    <i class="fas fa-check"></i> Entendido
                  </button>
                </div>
              </div>
            </template>

            <template v-else-if="selected.type === 'shadowwar-assignment'">
              <div class="req-detail-content">
                <div class="req-detail-header">
                  <div class="req-detail-type request">
                    <i class="fas fa-sword"></i>
                    <span>Asignación — Guerra Sombría</span>
                  </div>
                </div>

                <div class="req-detail-clan">
                  <i class="fas fa-khanda req-clan-icon"></i>
                  <div>
                    <h2 class="req-clan-name">{{ selected.raw.characterName ?? '—' }}</h2>
                    <p class="req-clan-sub">ha sido asignado a la próxima Guerra Sombría</p>
                  </div>
                </div>

                <p v-if="actionError" class="req-error">{{ actionError }}</p>

                <div class="req-detail-actions">
                  <button class="req-btn accept"
                    :disabled="processingId === selected.raw._notifId"
                    @click="confirmWarAssignment(selected)">
                    <i class="fas fa-check"></i>
                    {{ processingId === selected.raw._notifId ? 'Confirmando...' : 'Confirmar participación' }}
                  </button>
                  <button class="req-btn ghost" @click="dismissReviewedRequest(selected.raw._notifId)">
                    Descartar
                  </button>
                </div>
              </div>
            </template>

            <template v-else-if="selected.type === 'character-request-reviewed'">
              <div class="req-detail-content">
                <div class="req-detail-header">
                  <div class="req-detail-type" :class="selected.raw.action === 'accept' ? 'accepted' : 'rejected'">
                    <i :class="selected.raw.action === 'accept' ? 'fas fa-user-check' : 'fas fa-user-times'"></i>
                    <span>
                      {{ selected.raw.action === 'accept'
                        ? (selected.raw.type === 'claim' ? 'Reclamación aprobada' : 'Creación aprobada')
                        : (selected.raw.type === 'claim' ? 'Reclamación rechazada' : 'Creación rechazada') }}
                    </span>
                  </div>
                  <span class="req-detail-date">{{ formatDate(selected.raw.createdAt) }}</span>
                </div>

                <div class="req-detail-clan">
                  <i class="fas fa-khanda req-clan-icon"></i>
                  <div>
                    <h2 class="req-clan-name">{{ selected.raw.character?.name ?? '—' }}</h2>
                    <p class="req-clan-sub">
                      {{ selected.raw.action === 'accept'
                        ? 'tu personaje ha sido vinculado a tu cuenta'
                        : 'tu solicitud de personaje fue rechazada' }}
                    </p>
                  </div>
                </div>

                <div class="req-detail-actions">
                  <button class="req-btn ghost" @click="dismissReviewedRequest(selected.raw._notifId)">
                    <i class="fas fa-check"></i> Entendido
                  </button>
                </div>
              </div>
            </template>

          </div>

        </div>
      </AppLayout>
    </div>
  </main>
</template>

<style scoped lang="scss">
$gold: rgb(227, 210, 168);
$gold-dim: rgba(227, 210, 168, .12);
$border: rgba(255, 255, 255, .07);

.req-page-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.req-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: 100%;
  overflow: hidden;
}

/* ── Sidebar ── */
.req-sidebar {
  display: flex;
  flex-direction: column;
  border-right: 1px solid $border;
  overflow: hidden;
}

.req-sidebar-header {
  padding: 1.5rem 1.25rem 1rem;
  border-bottom: 1px solid $border;
  flex-shrink: 0;
}

.req-sidebar-label {
  font-size: .6rem;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .3);
  margin: 0 0 .2rem;
}

.req-sidebar-title {
  font-size: 1.1rem;
  margin: 0;
  color: var(--color-app-white);
}

.req-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .75rem;
  padding: 3rem 1rem;
  color: rgba(255, 255, 255, .3);
  font-size: .85rem;
  text-align: center;

  i { font-size: 1.6rem; }
  p { margin: 0; }
}

.req-list {
  list-style: none;
  margin: 0;
  padding: .5rem 0;
  overflow-y: auto;
  flex: 1;
}

.req-item {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .75rem 1.25rem;
  cursor: pointer;
  transition: background .15s;
  border-left: 3px solid transparent;

  &:hover { background: rgba(255, 255, 255, .03); }

  &.active {
    background: rgba(227, 210, 168, .05);
    border-left-color: $gold;
  }
}

.req-item-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: .85rem;

  &.clan-invitation {
    background: rgba(100, 160, 255, .1);
    color: rgba(100, 180, 255, .9);
  }

  &.clan-request-reviewed {
    background: rgba(129, 199, 132, .1);
    color: #81c784;
  }

  &.character-request-reviewed {
    background: rgba(129, 199, 132, .1);
    color: #81c784;
  }

  &.shadowwar-assignment {
    background: rgba(227, 210, 168, .08);
    color: rgb(227, 210, 168);
  }
}

.req-item-body {
  display: flex;
  flex-direction: column;
  gap: .1rem;
  flex: 1;
  min-width: 0;
}

.req-item-title {
  font-size: .88rem;
  font-weight: 600;
  color: var(--color-app-white);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.req-item-sub {
  font-size: .72rem;
  color: rgba(255, 255, 255, .4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.req-item-date {
  font-size: .68rem;
  color: rgba(255, 255, 255, .25);
  flex-shrink: 0;
}

/* ── Detail ── */
.req-detail {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 2rem;
}

.req-back-btn {
  display: none;
  align-items: center;
  gap: .5rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, .45);
  font-size: .82rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1.5rem;

  &:hover { color: rgba(255, 255, 255, .8); }
}

.req-detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  height: 100%;
  color: rgba(255, 255, 255, .2);
  font-size: .9rem;
  text-align: center;

  i { font-size: 2.5rem; }
  p { margin: 0; }
}

.req-detail-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.req-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.req-detail-type {
  display: flex;
  align-items: center;
  gap: .5rem;
  font-size: .7rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  font-family: 'Cinzel', serif;
  padding: .3rem .75rem;
  border-radius: 4px;

  &.invitation {
    background: rgba(100, 160, 255, .08);
    border: 1px solid rgba(100, 160, 255, .25);
    color: rgba(100, 180, 255, .9);
  }

  &.request {
    background: $gold-dim;
    border: 1px solid rgba(227, 210, 168, .25);
    color: rgba(227, 210, 168, .85);
  }

  &.accepted {
    background: rgba(129, 199, 132, .08);
    border: 1px solid rgba(129, 199, 132, .3);
    color: #81c784;
  }

  &.rejected {
    background: rgba(229, 115, 115, .08);
    border: 1px solid rgba(229, 115, 115, .3);
    color: #e57373;
  }
}

.req-detail-date {
  font-size: .75rem;
  color: rgba(255, 255, 255, .3);
}

.req-detail-clan {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, .03);
  border: 1px solid $gold-dim;
  border-radius: 10px;
}

.req-clan-icon {
  font-size: 1.8rem;
  color: $gold;
  flex-shrink: 0;
}

.req-clan-name {
  margin: 0;
  font-size: 1.3rem;
  font-family: 'Cinzel', serif;
  color: var(--color-app-white);
}

.req-clan-sub {
  margin: .25rem 0 0;
  font-size: .82rem;
  color: rgba(255, 255, 255, .45);
}

.req-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.req-detail-item {
  display: flex;
  flex-direction: column;
  gap: .3rem;
  padding: .85rem 1rem;
  background: rgba(255, 255, 255, .03);
  border: 1px solid $border;
  border-radius: 8px;
}

.req-detail-label {
  font-size: .65rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .35);
  font-family: 'Cinzel', serif;
}

.req-detail-value {
  font-size: .95rem;
  color: var(--color-app-white);

  &.req-role {
    &.officer { color: rgba(100, 180, 255, .9); }
    &.member  { color: $gold; }
  }
}

.req-detail-actions {
  display: flex;
  gap: .75rem;
}

.req-btn {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .55rem 1.25rem;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-size: .78rem;
  letter-spacing: .04em;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background .2s, border-color .2s;

  &:disabled { opacity: .4; cursor: not-allowed; }

  &.accept {
    background: transparent;
    border-color: rgba(129, 199, 132, .4);
    color: #81c784;
    &:hover:not(:disabled) { background: rgba(129, 199, 132, .08); border-color: #81c784; }
  }

  &.reject {
    background: transparent;
    border-color: rgba(229, 115, 115, .4);
    color: #e57373;
    &:hover:not(:disabled) { background: rgba(229, 115, 115, .08); border-color: #e57373; }
  }

  &.ghost {
    background: transparent;
    border-color: rgba(255, 255, 255, .15);
    color: rgba(255, 255, 255, .5);
    &:hover:not(:disabled) { border-color: rgba(255, 255, 255, .35); color: rgba(255, 255, 255, .8); }
  }
}

.req-error {
  margin: 0;
  font-size: .82rem;
  color: #e57373;
  padding: .5rem .75rem;
  background: rgba(229, 115, 115, .08);
  border: 1px solid rgba(229, 115, 115, .3);
  border-radius: 6px;
}

/* ── Mobile ── */
@media (max-width: 1100px) {
  .req-page-container { padding: 0; }

  .req-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;

    .req-detail { display: none; }

    &.show-detail {
      .req-sidebar { display: none; }
      .req-detail {
        display: flex;
        padding: 1.25rem;
      }
      .req-back-btn { display: flex; }
    }
  }

  .req-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
