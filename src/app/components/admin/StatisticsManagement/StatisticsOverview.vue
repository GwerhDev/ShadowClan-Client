<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Doughnut, Bar } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { useStore } from '../../../../middlewares/store';
import EmptyState from '../../common/EmptyState.vue';
import { classes } from '../../../../middlewares/misc/const';
import {
  getStatisticsOverview, getOverviewSummary, getClanMembersAttendanceSummary,
  getAttendanceCycles, getAttendanceCycleReport,
} from '../../../../middlewares/services';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const MEMBER_CAP = 100;

const store  = useStore();
const router = useRouter();

const chars       = computed(() => (store as any).currentUser.userData?.character ?? []);
const active      = computed(() => (chars.value as any[]).find((c: any) => c._id === (store as any).currentCharacter) ?? chars.value[0] ?? null);
const characterId = computed(() => active.value?._id ?? (store as any).currentCharacter);

type Range = '30' | '60' | '90' | 'cycle';

const swRange = ref<Range>('30');
const atRange = ref<Range>('30');
const swRangeTouched = ref(false);
const atRangeTouched = ref(false);
const swLoading = ref(true);
const atLoading = ref(true);
const swData = ref<any>(null);
const atData = ref<any>(null);
const clanAttendance = ref<any>(null);
const previousCyclePercentage = ref<number | null>(null);

const SW_RANGES = computed<Array<{ value: Range; label: string }>>(() => [
  { value: '30',    label: '30d' },
  { value: '60',    label: '60d' },
  { value: '90',    label: '90d' },
  { value: 'cycle', label: swData.value?.cycleIsOpen ? 'Ciclo actual' : 'Último ciclo' },
]);
const AT_RANGES = computed<Array<{ value: Range; label: string }>>(() => [
  { value: '30',    label: '30d' },
  { value: '60',    label: '60d' },
  { value: '90',    label: '90d' },
  { value: 'cycle', label: atData.value?.cycleIsOpen ? 'Ciclo actual' : 'Último ciclo' },
]);

const chartColors = { victory: '#4ade80', defeat: '#f87171', draw: '#facc15' };

function buildChartData(summary: { victory: number; defeat: number; draw: number } | null) {
  const s = summary ?? { victory: 0, defeat: 0, draw: 0 };
  return {
    labels: ['Victoria', 'Derrota', 'Empate'],
    datasets: [{
      data: [s.victory, s.defeat, s.draw],
      backgroundColor: [chartColors.victory, chartColors.defeat, chartColors.draw],
      borderColor: 'rgba(0,0,0,0)',
      borderWidth: 2,
    }],
  };
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { color: 'rgba(255, 255, 255, .65)', boxWidth: 12, padding: 12 } },
  },
};

const shadowWarChart     = computed(() => buildChartData(swData.value));
const accursedTowerChart = computed(() => buildChartData(atData.value));

function winRate(summary?: { victory: number; total: number } | null) {
  if (!summary || !summary.total) return 0;
  return Math.round((summary.victory / summary.total) * 100);
}

function formatDate(d?: string | Date | null) {
  if (!d) return null;
  const date = new Date(d);
  return isNaN(date.getTime()) ? null : date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

const summary = ref<any>(null);

const memberCount       = computed(() => summary.value?.memberCount ?? null);
const cyclesTotal       = computed(() => summary.value?.cyclesTotal ?? null);
const nextShadowWar     = computed(() => summary.value?.nextShadowWar ?? null);
const nextAccursedTower = computed(() => summary.value?.nextAccursedTower ?? null);

const memberUpdatedLabel = computed(() => {
  const formatted = formatDate(summary.value?.clanUpdatedAt);
  return formatted ? `actualizado ${formatted}` : 'sin registros de actualización';
});

const classDistribution = computed(() => {
  const counts: Record<string, number> = summary.value?.classCounts ?? {};
  const known = classes.map(cls => ({ name: cls.name, count: counts[cls.value] ?? 0 }));
  const unclassed = counts['unknown'] ?? 0;
  return [...known, { name: 'Sin clase', count: unclassed }];
});

const classDistributionChart = computed(() => ({
  labels: classDistribution.value.map(c => c.name),
  datasets: [{
    label: 'Personajes',
    data: classDistribution.value.map(c => c.count),
    backgroundColor: 'rgba(227, 210, 168, .55)',
    borderColor: 'rgba(227, 210, 168, .9)',
    borderWidth: 1,
    borderRadius: 4,
  }],
}));

const classDistributionOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      ticks: { color: 'rgba(255, 255, 255, .6)', font: { size: 10 } },
      grid:  { color: 'rgba(255, 255, 255, .04)' },
    },
    y: {
      beginAtZero: true,
      ticks: { color: 'rgba(255, 255, 255, .5)', precision: 0 },
      grid:  { color: 'rgba(255, 255, 255, .06)' },
    },
  },
};

async function fetchSummary() {
  try { summary.value = await getOverviewSummary(characterId.value); }
  catch { summary.value = null; }
}

async function fetchShadowWar() {
  swLoading.value = true;
  try {
    swData.value = await getStatisticsOverview(swRange.value, characterId.value, 'shadow_war');
    if (!swRangeTouched.value && swData.value?.hasCycle && swRange.value !== 'cycle') {
      swRange.value = 'cycle';
    }
  } finally {
    swLoading.value = false;
  }
}

async function fetchAccursedTower() {
  atLoading.value = true;
  try {
    atData.value = await getStatisticsOverview(atRange.value, characterId.value, 'accursed_tower');
    if (!atRangeTouched.value && atData.value?.hasCycle && atRange.value !== 'cycle') {
      atRange.value = 'cycle';
    }
  } finally {
    atLoading.value = false;
  }
}

async function fetchClanAttendance() {
  try { clanAttendance.value = await getClanMembersAttendanceSummary(characterId.value, 'cycle'); }
  catch { clanAttendance.value = null; }
}

// El ciclo anterior al actual (cycleUsed) — sin endpoint dedicado, se toma el
// segundo elemento del listado de ciclos 'shadow' (ordenado por startDate desc)
// y se agrega su reporte de miembros para obtener un % a nivel clan.
async function fetchPreviousCycleAttendance() {
  try {
    const list = (await getAttendanceCycles(1, characterId.value, 'shadow')).data ?? [];
    const previous = list[1];
    if (!previous) { previousCyclePercentage.value = null; return; }

    const report = await getAttendanceCycleReport(previous._id, characterId.value);
    const members = report.members ?? [];
    const totalAttended  = members.reduce((sum: number, m: any) => sum + (m.attendedCount ?? 0), 0);
    const totalPossible  = members.reduce((sum: number, m: any) => sum + (m.totalActivities ?? 0), 0);
    previousCyclePercentage.value = totalPossible ? Math.round((totalAttended / totalPossible) * 100) : 0;
  } catch { previousCyclePercentage.value = null; }
}

function cycleTypeLabel(type?: string) {
  return type === 'immortal' ? 'Ciclo Inmortal' : 'Ciclo Sombra';
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const cycleWeekNumber = computed(() => {
  const cycle = swData.value?.cycleUsed;
  if (!cycle?.startDate) return null;
  const start = new Date(cycle.startDate).getTime();
  const ref   = cycle.endDate ? new Date(cycle.endDate).getTime() : Date.now();
  return Math.max(1, Math.floor((ref - start) / MS_PER_WEEK) + 1);
});

function selectSwRange(r: Range) {
  if (r === 'cycle' && !swData.value?.hasCycle) return;
  swRangeTouched.value = true;
  swRange.value = r;
}
function selectAtRange(r: Range) {
  if (r === 'cycle' && !atData.value?.hasCycle) return;
  atRangeTouched.value = true;
  atRange.value = r;
}

watch(swRange, fetchShadowWar);
watch(atRange, fetchAccursedTower);

onMounted(() => {
  fetchShadowWar();
  fetchAccursedTower();
  fetchSummary();
  fetchClanAttendance();
  fetchPreviousCycleAttendance();
});

function resultBreakdown(summary?: { victory: number; defeat: number; draw: number } | null) {
  if (!summary) return '';
  return `${summary.victory}V · ${summary.defeat}D · ${summary.draw}E`;
}

// Cards con ruta propia (fuera de Estadísticas) van arriba de los gráficos.
const topCards = computed(() => [
  {
    key: 'members', icon: 'fas fa-users', label: 'Miembros',
    value: memberCount.value !== null ? `${memberCount.value}/${MEMBER_CAP}` : '—',
    hint: memberUpdatedLabel.value, to: '/management/clan',
  },
  {
    key: 'next-shadow-war', icon: 'fas fa-khanda', label: 'Próxima Guerra Sombría',
    value: nextShadowWar.value ? (nextShadowWar.value.enemyClan?.name ? `vs ${nextShadowWar.value.enemyClan.name}` : 'Sin enemigo') : 'Sin programar',
    hint: formatDate(nextShadowWar.value?.date) ?? '',
    to: '/management/shadow-war',
  },
  {
    key: 'next-accursed-tower', icon: 'fas fa-chess-rook', label: 'Próxima Torre Maldita',
    value: nextAccursedTower.value ? (nextAccursedTower.value.enemyClan?.name ? `vs ${nextAccursedTower.value.enemyClan.name}` : 'Sin enemigo') : 'Sin programar',
    hint: formatDate(nextAccursedTower.value?.date) ?? '',
    to: '/management/accursed-tower',
  },
]);

// Cards que son hijas de Estadísticas (Overview) van abajo de los gráficos.
const bottomCards = computed(() => [
  { key: 'shadow-wars',    icon: 'fas fa-khanda',     label: 'Guerra Sombría', value: `${winRate(swData.value)}%`, hint: resultBreakdown(swData.value), to: { name: 'ManagementOverviewShadowWars' } },
  { key: 'accursed-tower', icon: 'fas fa-chess-rook', label: 'Torre Maldita',  value: `${winRate(atData.value)}%`, hint: resultBreakdown(atData.value), to: { name: 'ManagementOverviewAccursedTower' } },
]);
</script>

<template>
  <div class="statistics-overview">
    <div
      class="cycle-status-card"
      :class="{ 'cycle-status-card--empty': !swData?.hasCycle }"
      @click="router.push({ name: 'ManagementOverviewCycles' })"
    >
      <div class="cycle-status-header">
        <i class="fas fa-khanda"></i>
        <span>{{ cycleTypeLabel(swData?.cycleUsed?.activityType) }}</span>
        <span
          v-if="swData?.hasCycle"
          class="cycle-status-badge"
          :class="swData.cycleIsOpen ? 'cycle-status-badge--open' : 'cycle-status-badge--closed'"
        >{{ swData.cycleIsOpen ? 'Vigente' : 'Finalizado' }}</span>
      </div>

      <div v-if="swData?.hasCycle" class="cycle-status-body">
        <div class="cycle-status-metric">
          <span class="cycle-status-value">Semana {{ cycleWeekNumber }}</span>
          <span class="cycle-status-label">del ciclo</span>
        </div>
        <div class="cycle-status-metric">
          <span class="cycle-status-value">{{ clanAttendance?.clanPercentage ?? 0 }}%</span>
          <span class="cycle-status-label">asistencia del clan</span>
        </div>
        <div class="cycle-status-metric">
          <span class="cycle-status-value">{{ previousCyclePercentage !== null ? previousCyclePercentage + '%' : '—' }}</span>
          <span class="cycle-status-label">asistencia ciclo anterior</span>
        </div>
        <div v-if="cyclesTotal" class="cycle-status-metric cycle-status-metric--minor">
          <span class="cycle-status-value">{{ cyclesTotal }}</span>
          <span class="cycle-status-label">ciclos en total</span>
        </div>
      </div>
      <p v-else class="cycle-status-empty">Sin ciclo de Guerra Sombría definido.</p>

      <i class="fas fa-arrow-right cycle-status-arrow"></i>
    </div>

    <div class="stat-grid">
      <div v-for="card in topCards" :key="card.key" class="stat-card stat-card--link" @click="router.push(card.to)">
        <div class="stat-icon"><i :class="card.icon"></i></div>
        <div class="stat-body">
          <span class="stat-value">{{ card.value }}</span>
          <span class="stat-label">{{ card.label }}</span>
          <span v-if="card.hint" class="stat-hint">{{ card.hint }}</span>
        </div>
        <i class="fas fa-arrow-right stat-arrow"></i>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-card-header">
          <i class="fas fa-khanda"></i>
          <span>Guerra Sombría</span>
          <span class="chart-total">{{ swData?.total ?? 0 }} partidas</span>
        </div>
        <div class="range-filters">
          <button
            v-for="r in SW_RANGES"
            :key="r.value"
            class="range-btn"
            :class="{ active: swRange === r.value }"
            :disabled="r.value === 'cycle' && !swData?.hasCycle"
            :title="r.value === 'cycle' && !swData?.hasCycle ? 'El clan no tiene ciclos de Guerra Sombría definidos' : ''"
            @click="selectSwRange(r.value)"
          >{{ r.label }}</button>
        </div>
        <EmptyState v-if="swLoading" icon="fas fa-spinner fa-spin" message="Cargando..." :compact="true" />
        <div v-else class="chart-body">
          <Doughnut :data="shadowWarChart" :options="chartOptions" />
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-card-header">
          <i class="fas fa-chess-rook"></i>
          <span>Torre Maldita</span>
          <span class="chart-total">{{ atData?.total ?? 0 }} partidas</span>
        </div>
        <div class="range-filters">
          <button
            v-for="r in AT_RANGES"
            :key="r.value"
            class="range-btn"
            :class="{ active: atRange === r.value }"
            :disabled="r.value === 'cycle' && !atData?.hasCycle"
            :title="r.value === 'cycle' && !atData?.hasCycle ? 'El clan no tiene ciclos de Torre Maldita definidos' : ''"
            @click="selectAtRange(r.value)"
          >{{ r.label }}</button>
        </div>
        <EmptyState v-if="atLoading" icon="fas fa-spinner fa-spin" message="Cargando..." :compact="true" />
        <div v-else class="chart-body">
          <Doughnut :data="accursedTowerChart" :options="chartOptions" />
        </div>
      </div>
    </div>

    <div class="chart-card chart-card--wide">
      <div class="chart-card-header">
        <i class="fas fa-users"></i>
        <span>Composición del clan</span>
        <span class="chart-total">{{ memberCount ?? 0 }} personajes</span>
      </div>
      <EmptyState v-if="!memberCount" icon="fas fa-users-slash" message="El clan no tiene miembros." :compact="true" />
      <div v-else class="chart-body chart-body--wide">
        <Bar :data="classDistributionChart" :options="classDistributionOptions" />
      </div>
    </div>

    <div class="stat-grid">
      <div v-for="card in bottomCards" :key="card.key" class="stat-card stat-card--link" @click="router.push(card.to)">
        <div class="stat-icon"><i :class="card.icon"></i></div>
        <div class="stat-body">
          <span class="stat-value">{{ card.value }}</span>
          <span class="stat-label">{{ card.label }}</span>
          <span v-if="card.hint" class="stat-hint">{{ card.hint }}</span>
        </div>
        <i class="fas fa-arrow-right stat-arrow"></i>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./StatisticsOverview.scss" />
