<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from '../../../../middlewares/store';
import TableComponent from '../../Tables/TableComponent.vue';
import ClassImage from '../../common/ClassImage.vue';
import EmptyState from '../../common/EmptyState.vue';
import CharacterProfileModal from './CharacterProfileModal.vue';
import { getAttendanceWeek, setMemberAttendance, createShadowWarManagement, getClanMembersAttendanceSummary } from '../../../../middlewares/services';

const store: any = useStore();

const chars       = computed(() => store.currentUser.userData?.character ?? []);
const active      = computed(() => (chars.value as any[]).find((c: any) => c._id === store.currentCharacter) ?? chars.value[0] ?? null);
const characterId = computed(() => active.value?._id ?? store.currentCharacter);

const navItems = ['miembro', 'jueves', 'sábado'];

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
const loading     = ref(true);
const week        = ref<any>(null);
const savingKeys  = ref<Set<string>>(new Set());
const creatingDay = ref<string | null>(null);
const searchQuery = ref('');
const activityType = ref<'shadow_war' | 'accursed_tower'>('shadow_war');

const selectedMember  = ref<any>(null);
const attendanceStats = ref<Record<string, { percentage: number; attended: number; totalActivities: number }>>({});

const filteredMembers = computed(() => {
  const members = week.value?.members ?? [];
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return members;
  return members.filter((m: any) => (m.name ?? '').toLowerCase().includes(q));
});

const weekRangeLabel = computed(() => {
  if (!week.value?.weekStart) return '';
  const start = new Date(week.value.weekStart + 'T12:00:00Z');
  const end   = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${fmt(start)} — ${fmt(end)}`;
});

function cellKey(memberId: string, dayKey: string) { return `${memberId}:${dayKey}`; }

async function fetchWeek() {
  loading.value = true;
  try {
    week.value = await getAttendanceWeek(refDate.value, characterId.value);
  } finally {
    loading.value = false;
  }
}

function fetchAttendanceStats() {
  getClanMembersAttendanceSummary(characterId.value, 30)
    .then(data => { attendanceStats.value = data; })
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

onMounted(() => {
  fetchWeek();
  fetchAttendanceStats();
});
</script>

<template>
  <div class="attendance-register">
    <div class="attendance-toolbar">
      <div class="search-wrap">
        <i class="fas fa-magnifying-glass search-icon"></i>
        <input v-model="searchQuery" class="search-input" placeholder="Buscar miembro..." :disabled="loading || !week" />
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

    <EmptyState v-if="loading" icon="fas fa-spinner fa-spin" message="Cargando semana..." :compact="true" />

    <template v-else-if="week">
      <TableComponent :navItems="navItems">
        <template #header>
          <li class="header-cell">miembro</li>
          <li v-for="day in week.days" :key="day.key" class="header-cell day-header">
            <span>{{ day.label }} {{ formatShort(day.date) }}</span>
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

        <div v-for="member in filteredMembers" :key="member._id" class="attendance-row">
          <span class="member-cell" @click="openProfile(member)">
            <ClassImage :current-class="member.currentClass" :size="28" />
            <p>{{ member.name }}</p>
          </span>
          <span v-for="day in week.days" :key="day.key">
            <input
              v-if="day.shadowWar"
              type="checkbox"
              :checked="member.attendance[day.key] === true"
              :disabled="savingKeys.has(cellKey(member._id, day.key))"
              @change="toggle(member, day)"
            />
            <span v-else class="no-war">—</span>
          </span>
        </div>

        <div v-if="!week.members.length" class="table-empty-row">
          <i class="fas fa-users-slash"></i>
          <span>El clan no tiene miembros.</span>
        </div>
        <div v-else-if="!filteredMembers.length" class="table-empty-row">
          <i class="fas fa-magnifying-glass"></i>
          <span>Sin resultados para "{{ searchQuery }}".</span>
        </div>
      </TableComponent>
    </template>
  </div>

  <CharacterProfileModal
    v-if="selectedMember"
    :member="selectedMember"
    :attendance-pct="attendanceStats[selectedMember._id]?.percentage ?? null"
    @close="selectedMember = null"
  />
</template>

<style scoped lang="scss" src="./AttendanceRegister.scss" />
