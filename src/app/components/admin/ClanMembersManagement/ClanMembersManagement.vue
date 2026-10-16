<style scoped lang="scss" src="./ClanMembersManagement.scss" />
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from '../../../../middlewares/store';
import TableComponent from '../../Tables/TableComponent.vue';
import ClanMemberCard from './ClanMemberCard.vue';
import PendingInvitationCard from './PendingInvitationCard.vue';
import ExMemberCard from './ExMemberCard.vue';
import CharacterProfileModal from '../AttendanceManagement/CharacterProfileModal.vue';
import SyncClanModal from './SyncClanModal.vue';
import ClanRequestsModal from './ClanRequestsModal.vue';
import AddMemberModal from './AddMemberModal.vue';
import { getClanMembers, getClanMembersPage } from '../../../../middlewares/services';
import { useActiveCharacter } from '../../../composables/useActiveCharacter';

const store = useStore();
const { active, clanId } = useActiveCharacter();
// Solo para tipar las props de los hijos: la vista requiere un clan (el valor no cambia).
const clanIdProp = computed(() => clanId.value as string);

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
const statusFilter   = ref<'all' | 'active' | 'ex'>('all');
const sentinel       = ref<HTMLElement | null>(null);
let   scrollObserver: IntersectionObserver | null = null;
let   searchDebounce: ReturnType<typeof setTimeout> | null = null;


const navItems = ['estado', 'nombre', 'rol', 'clase', 'puntaje'];

// Los permisos se evalúan sobre el personaje activo, igual que en el backend.
const isLeader = computed(() => {
  if (!clan.value || !store.currentCharacter) return false;
  const leaderId = String(clan.value.leader?._id ?? clan.value.leader ?? '');
  return !!leaderId && leaderId === String(store.currentCharacter);
});

const isOfficer = computed(() => {
  if (!clan.value || !store.currentCharacter) return false;
  return (clan.value.officer ?? []).some((o: any) => String(o._id ?? o) === String(store.currentCharacter));
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

watch(statusFilter, () => loadMembers(true));

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => loadMembers(true), 500);
});

// ── Character profile modal ──
const selectedMember = ref<any>(null);

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

const emptyStateMessage = computed(() => {
  if (searchQuery.value) return `Sin resultados para "${searchQuery.value}".`;
  if (statusFilter.value === 'ex')     return 'Este clan no tiene exmiembros.';
  if (statusFilter.value === 'active') return 'Este clan no tiene miembros activos.';
  return 'No hay miembros en el clan.';
});

async function loadMembers(reset: boolean) {
  if (!clanId.value) return;
  if (membersLoading.value) return;
  if (reset) { membersPage.value = 1; members.value = []; membersHasMore.value = false; }
  membersLoading.value = true;
  try {
    const res = await getClanMembersPage(clanId.value, {
      page:   membersPage.value,
      limit:  20,
      q:      searchQuery.value || undefined,
      status: statusFilter.value,
    });
    members.value     = reset ? res.members : [...members.value, ...res.members];
    membersTotal.value = res.total;
    membersHasMore.value = res.hasMore;
    if (res.hasMore) membersPage.value++;
  } finally {
    membersLoading.value = false;
  }
}

// ── Modales ──
const showRequestsModal = ref(false);
const showAddModal      = ref(false);
const showSyncModal     = ref(false);
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
        <button class="btn-secondary btn-with-badge" @click="showRequestsModal = true">
          <i class="fas fa-inbox"></i> Ver solicitudes
          <span v-if="store.pendingRequestsCount > 0" class="btn-badge">{{ store.pendingRequestsCount }}</span>
        </button>
        <button class="btn-secondary" @click="showSyncModal = true">
          <i class="fas fa-rotate"></i> Actualizar
        </button>
        <button @click="showAddModal = true">
          <i class="fas fa-user-plus"></i> Agregar miembro
        </button>
      </span>
    </div>

    <div v-if="!loading">
      <TableComponent :navItems="navItems">
        <template #header>
          <li class="header-cell">
            <select v-model="statusFilter" class="type-filter-select" :class="{ active: statusFilter !== 'all' }">
              <option value="all">Todos</option>
              <option value="active">Miembros actuales</option>
              <option value="ex">Exmiembros</option>
            </select>
          </li>
          <li class="header-cell sticky-col">nombre</li>
          <li class="header-cell">rol</li>
          <li class="header-cell">clase</li>
          <li class="header-cell">puntaje</li>
        </template>

        <template v-if="members.length || pendingInvitations.length || membersLoading">
          <template v-for="m in members" :key="m._id">
            <ExMemberCard v-if="m.isExMember" :char="m" />
            <ClanMemberCard
              v-else
              :char="m"
              :role="m.role"
              @open-profile="selectedMember = $event"
            />
          </template>
          <PendingInvitationCard
            v-for="inv in pendingInvitations"
            :key="inv._id"
            :inv="inv"
            :clanId="clanIdProp"
            @refresh="loadClan"
          />
          <div
            v-if="membersLoading"
            v-for="n in 5"
            :key="'sk' + n"
            class="member-skeleton-row"
          >
            <span v-for="c in 5" :key="c" class="skeleton-box skeleton-cell"></span>
          </div>
        </template>
        <div v-else class="table-empty-row">
          <i class="fas fa-users-slash"></i>
          <span>{{ emptyStateMessage }}</span>
        </div>
      </TableComponent>

      <div ref="sentinel" class="sentinel"></div>
    </div>

    <div v-else-if="loading" class="skeleton-table-container">
      <div class="skeleton-table-header">
        <div v-for="n in 5" :key="n" class="skeleton-box skeleton-header-item"></div>
      </div>
      <div class="skeleton-table-row" v-for="n in 5" :key="n">
        <div v-for="i in 5" :key="i" class="skeleton-box skeleton-cell"></div>
      </div>
    </div>

    <p v-else-if="error">{{ error }}</p>
    <p v-else>No hay miembros en el clan.</p>

  </div>

  <!-- Modal: perfil de personaje -->
  <CharacterProfileModal
    v-if="selectedMember"
    :member="selectedMember"
    :clan-id="clanIdProp"
    :is-leader="isLeader"
    :is-officer="isOfficer"
    @refresh="loadClan"
    @close="selectedMember = null"
  />

  <!-- Modal: sincronizar desde archivo -->
  <SyncClanModal
    v-if="showSyncModal"
    :clan-id="clanIdProp"
    :reload="loadClan"
    @close="showSyncModal = false"
  />

  <!-- Modal: solicitudes de ingreso -->
  <ClanRequestsModal
    v-if="showRequestsModal"
    :character-id="active?._id ?? undefined"
    :reload="loadClan"
    @close="showRequestsModal = false"
  />

  <!-- Modal: agregar miembro -->
  <AddMemberModal
    v-if="showAddModal"
    :clan-id="clanIdProp"
    :is-leader="isLeader"
    :is-officer="isOfficer"
    :reload="loadClan"
    @close="showAddModal = false"
  />
</template>
