<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from '../../../../middlewares/store';
import TableComponent from '../../Tables/TableComponent.vue';
import ClassImage from '../../common/ClassImage.vue';
import CharacterProfileModal from './CharacterProfileModal.vue';
import { getAttendanceWeek, setMemberAttendance, createShadowWarManagement, getClanMembersAttendanceSummary } from '../../../../middlewares/services';

const store: any = useStore();

const chars       = computed(() => store.currentUser.userData?.character ?? []);
const active      = computed(() => (chars.value as any[]).find((c: any) => c._id === store.currentCharacter) ?? chars.value[0] ?? null);
const characterId = computed(() => active.value?._id ?? store.currentCharacter);

const navItems = ['miembro', 'jueves', 'sábado'];
// Miembro fijo (sticky) + columnas de día lo bastante anchas para fecha + botón "Crear" sin wrap.
const gridTemplate = 'minmax(150px, 1.2fr) repeat(2, minmax(170px, 1fr))';

function todayStr() { return new Date().toISOString().slice(0, 10); }
function shiftDate(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function formatShort(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

const refDate     = ref(todayStr());
const loading     = ref(true);       // skeleton de página completa: montaje inicial y cambio de semana
const week        = ref<any>(null);  // { weekStart, days }
const savingKeys  = ref<Set<string>>(new Set());
const creatingDay = ref<string | null>(null);
const searchQuery = ref('');
const activityType = ref<'shadow_war' | 'accursed_tower'>('shadow_war');

const selectedMember  = ref<any>(null);
const attendanceStats = ref<Record<string, { percentage: number; attended: number; totalActivities: number }>>({});

// ── Miembros paginados (infinite scroll) ──
const members        = ref<any[]>([]);
const membersPage    = ref(1);
const membersHasMore = ref(false);
const membersLoading = ref(false);
const membersTotal   = ref(0);
const sentinel        = ref<HTMLElement | null>(null);
let   scrollObserver: IntersectionObserver | null = null;
let   searchDebounce: ReturnType<typeof setTimeout> | null = null;

const weekRangeLabel = computed(() => {
  if (!week.value?.weekStart) return '';
  const start = new Date(week.value.weekStart + 'T12:00:00Z');
  const end   = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${fmt(start)} — ${fmt(end)}`;
});

function cellKey(memberId: string, dayKey: string) { return `${memberId}:${dayKey}`; }

async function loadWeek(reset: boolean) {
  if (membersLoading.value) return;
  if (reset) { membersPage.value = 1; members.value = []; membersHasMore.value = false; }
  membersLoading.value = true;
  try {
    const res = await getAttendanceWeek(refDate.value, characterId.value, {
      page:  membersPage.value,
      limit: 20,
      q:     searchQuery.value || undefined,
    });
    week.value = { weekStart: res.weekStart, days: res.days };
    members.value       = reset ? res.members : [...members.value, ...res.members];
    membersTotal.value  = res.total;
    membersHasMore.value = res.hasMore;
    if (res.hasMore) membersPage.value++;
  } finally {
    membersLoading.value = false;
  }
}

async function fetchWeek() {
  loading.value = true;
  try {
    await loadWeek(true);
  } finally {
    loading.value = false;
  }
}

function fetchAttendanceStats() {
  getClanMembersAttendanceSummary(characterId.value, 30)
    .then((data: any) => { attendanceStats.value = data; })
    .catch(() => {});
}

function openProfile(member: any) {
  selectedMember.value = member;
}

function prevWeek() { refDate.value = shiftDate(refDate.value, -7); fetchWeek(); }
function nextWeek() { refDate.value = shiftDate(refDate.value, 7);  fetchWeek(); }

async function toggle(member: any, day: any) {
  if (!day?.shadowWar) return;
  const key = cellKey(member._id, day.key);
  savingKeys.value.add(key);
  const next = !(member.attendance[day.key] === true);
  try {
    await setMemberAttendance(day.shadowWar._id, member._id, next, characterId.value);
    member.attendance[day.key] = next;
  } finally {
    savingKeys.value.delete(key);
  }
}

async function createWar(day: any) {
  creatingDay.value = day.key;
  try {
    await createShadowWarManagement(day.date, null, characterId.value);
    await fetchWeek();
  } finally {
    creatingDay.value = null;
  }
}

function setupObserver() {
  scrollObserver?.disconnect();
  if (!sentinel.value) return;
  scrollObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && membersHasMore.value && !membersLoading.value) {
      loadWeek(false);
    }
  }, { threshold: 0.1 });
  scrollObserver.observe(sentinel.value);
}

onMounted(() => {
  fetchWeek();
  fetchAttendanceStats();
});

onUnmounted(() => scrollObserver?.disconnect());

watch(sentinel, (el) => { if (el) setupObserver(); });

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => loadWeek(true), 500);
});
</script>

<template>
  <div class="attendance-register">
    <div class="attendance-toolbar">
      <div class="search-wrap">
        <i class="fas fa-magnifying-glass search-icon"></i>
        <input v-model="searchQuery" class="search-input" placeholder="Buscar miembro..." :disabled="loading" />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
          <i class="fas fa-xmark"></i>
        </button>
      </div>

      <div class="week-nav">
        <button class="week-nav-btn" @click="prevWeek" :disabled="loading" title="Semana anterior">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="week-nav-label">{{ weekRangeLabel }}</span>
        <button class="week-nav-btn" @click="nextWeek" :disabled="loading" title="Semana siguiente">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <div class="activity-select-wrap">
        <select v-model="activityType" class="activity-select">
          <option value="shadow_war">Guerra Sombría</option>
          <option value="accursed_tower" disabled>Torre Maldita</option>
        </select>
      </div>
    </div>

    <div v-if="!loading">
      <TableComponent :navItems="navItems" :grid-template="gridTemplate">
        <template #header>
          <li class="header-cell sticky-col">miembro</li>
          <li v-for="day in week.days" :key="day.key" class="header-cell day-header">
            <span class="day-date">{{ day.label }} {{ formatShort(day.date) }}</span>
            <button
              v-if="!day.shadowWar"
              class="btn-create-day"
              :disabled="creatingDay === day.key"
              @click="createWar(day)"
              title="Crear Shadow War para este día"
            >
              <i class="fas fa-plus"></i> Crear
            </button>
          </li>
        </template>

        <div v-for="member in members" :key="member._id" class="attendance-row">
          <span class="member-cell sticky-col" @click="openProfile(member)">
            <ClassImage :current-class="member.currentClass" :size="28" />
            <p>{{ member.name }}</p>
            <i class="fas fa-circle-info member-info-icon" title="Ver detalle"></i>
          </span>
          <span v-for="day in week.days" :key="day.key">
            <i
              v-if="day.shadowWar && savingKeys.has(cellKey(member._id, day.key))"
              class="fas fa-spinner fa-spin attendance-spinner"
            ></i>
            <input
              v-else-if="day.shadowWar"
              type="checkbox"
              :checked="member.attendance[day.key] === true"
              @change="toggle(member, day)"
            />
            <span v-else class="no-war">—</span>
          </span>
        </div>

        <div v-if="membersLoading" v-for="n in 4" :key="'sk' + n" class="attendance-row-skeleton">
          <span v-for="c in 3" :key="c" class="skeleton-box skeleton-cell"></span>
        </div>

        <div v-if="!members.length && !membersLoading" class="table-empty-row">
          <i class="fas fa-users-slash"></i>
          <span>{{ searchQuery ? `Sin resultados para "${searchQuery}".` : 'El clan no tiene miembros.' }}</span>
        </div>
      </TableComponent>

      <div ref="sentinel" class="sentinel"></div>
    </div>

    <div v-else class="skeleton-table-container">
      <div class="skeleton-table-header">
        <div v-for="n in 3" :key="n" class="skeleton-box skeleton-header-item"></div>
      </div>
      <div class="skeleton-table-row" v-for="n in 6" :key="n">
        <div v-for="i in 3" :key="i" class="skeleton-box skeleton-cell"></div>
      </div>
    </div>
  </div>

  <CharacterProfileModal
    v-if="selectedMember"
    :member="selectedMember"
    :attendance-pct="attendanceStats[selectedMember._id]?.percentage ?? null"
    @close="selectedMember = null"
  />
</template>

<style scoped lang="scss" src="./AttendanceRegister.scss" />
