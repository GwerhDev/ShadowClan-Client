<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useStore } from '../../middlewares/store';
import type { InboxItem } from '../../interfaces';
import { getClanInvitations, reviewClanInvitation, respondToPublicShadowWar, respondToPublicTowerWar } from '../../middlewares/services';
import AppLayout from '../layouts/AppLayout.vue';
import RequestDetailContent from '../components/Requests/RequestDetailContent.vue';

const store = useStore();

const invitations = ref<any[]>([]);
const loading = ref(true);
const selected = ref<InboxItem | null>(null);
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

const towerAssignments = computed(() =>
  (store.notifications as any[])
    .filter((n: any) => n.type === 'tower-assignment' && String(n.targetId) === String(store.currentCharacter))
    .map((n: any) => ({ type: 'tower-assignment', raw: { ...n.data, _notifId: n.id } }))
);

const allItems = computed(() => [
  ...visibleInvitations.value.map(inv => ({ type: 'clan-invitation', raw: inv })),
  ...reviewedRequests.value,
  ...reviewedCharacterRequests.value,
  ...shadowWarAssignments.value,
  ...towerAssignments.value,
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function itemTitle(item: { type: string; raw: any }): string {
  if (item.type === 'clan-invitation') return item.raw.clan?.name ?? '—';
  if (item.type === 'clan-request-reviewed') return item.raw.clan?.name ?? '—';
  if (item.type === 'character-request-reviewed') return item.raw.character?.name ?? '—';
  if (item.type === 'shadowwar-assignment') return item.raw.characterName ?? '—';
  if (item.type === 'tower-assignment') return item.raw.characterName ?? '—';
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
  if (item.type === 'tower-assignment') return 'Asignación — Torre Maldita';
  return '—';
}

async function confirmWarAssignment(item: { type: string; raw: any }) {
  processingId.value = item.raw._notifId;
  actionError.value = '';
  try {
    await respondToPublicShadowWar(item.raw.shadowWarId, item.raw.characterId, 'confirm');
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

async function confirmTowerAssignment(item: { type: string; raw: any }) {
  processingId.value = item.raw._notifId;
  actionError.value = '';
  try {
    await respondToPublicTowerWar(item.raw.towerId, item.raw.characterId, 'confirm');
    await store.handleGetActiveTowerWar();
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
                    : item.type === 'tower-assignment'       ? 'fas fa-chess-rook'
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

            <RequestDetailContent
              :selected="selected"
              :processing-id="processingId"
              :action-error="actionError"
              @review="reviewInvitation"
              @confirm-war="confirmWarAssignment"
              @confirm-tower="confirmTowerAssignment"
              @dismiss="dismissReviewedRequest"
            />
          </div>

        </div>
      </AppLayout>
    </div>
  </main>
</template>

<style scoped lang="scss" src="./RequestsPage.scss" />
