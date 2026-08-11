<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useStore } from '../../../../middlewares/store';
import EmptyState from '../../common/EmptyState.vue';
import { getStatisticsOverview, getClanMembers, getActiveShadowWar, getActiveAccursedTower, getAttendanceCycles } from '../../../../middlewares/services';

ChartJS.register(ArcElement, Tooltip, Legend);

const MEMBER_CAP = 100;

const store  = useStore();
const router = useRouter();

const chars       = computed(() => (store as any).currentUser.userData?.character ?? []);
const active      = computed(() => (chars.value as any[]).find((c: any) => c._id === (store as any).currentCharacter) ?? chars.value[0] ?? null);
const characterId = computed(() => active.value?._id ?? (store as any).currentCharacter);
const clanId      = computed(() => active.value?.clan?._id ?? active.value?.clan ?? null);

type Range = '30' | '60' | '90' | 'cycle';
const RANGES: Array<{ value: Range; label: string }> = [
  { value: '30',    label: '30d' },
  { value: '60',    label: '60d' },
  { value: '90',    label: '90d' },
  { value: 'cycle', label: 'Último ciclo' },
];

const swRange = ref<Range>('30');
const atRange = ref<Range>('30');
const swLoading = ref(true);
const atLoading = ref(true);
const swData = ref<any>(null);
const atData = ref<any>(null);

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

const memberCount      = ref<number | null>(null);
const clanUpdatedAt    = ref<string | null>(null);
const nextShadowWar     = ref<any>(null);
const nextAccursedTower = ref<any>(null);
const cyclesTotal       = ref<number | null>(null);

const memberUpdatedLabel = computed(() => {
  const formatted = formatDate(clanUpdatedAt.value);
  return formatted ? `actualizado ${formatted}` : 'sin registros de actualización';
});

async function fetchMemberCount() {
  if (!clanId.value) return;
  try {
    const clan = await getClanMembers(clanId.value);
    memberCount.value = (clan.leader ? 1 : 0) + (clan.officer?.length ?? 0) + (clan.member?.length ?? 0);
    clanUpdatedAt.value = clan.updatedAt ?? null;
  } catch { memberCount.value = null; clanUpdatedAt.value = null; }
}

async function fetchCyclesTotal() {
  try {
    const response = await getAttendanceCycles(1, characterId.value);
    cyclesTotal.value = response.total ?? 0;
  } catch { cyclesTotal.value = null; }
}

async function fetchNextShadowWar() {
  try { nextShadowWar.value = await getActiveShadowWar(characterId.value); }
  catch { nextShadowWar.value = null; }
}

async function fetchNextAccursedTower() {
  try {
    const towers = await getActiveAccursedTower(characterId.value);
    nextAccursedTower.value = Array.isArray(towers) ? (towers[0] ?? null) : null;
  } catch { nextAccursedTower.value = null; }
}

async function fetchShadowWar() {
  swLoading.value = true;
  try {
    swData.value = await getStatisticsOverview(swRange.value, characterId.value, 'shadow_war');
  } finally {
    swLoading.value = false;
  }
}

async function fetchAccursedTower() {
  atLoading.value = true;
  try {
    atData.value = await getStatisticsOverview(atRange.value, characterId.value, 'accursed_tower');
  } finally {
    atLoading.value = false;
  }
}

function selectSwRange(r: Range) {
  if (r === 'cycle' && !swData.value?.hasCycle) return;
  swRange.value = r;
}
function selectAtRange(r: Range) {
  if (r === 'cycle' && !atData.value?.hasCycle) return;
  atRange.value = r;
}

watch(swRange, fetchShadowWar);
watch(atRange, fetchAccursedTower);

onMounted(() => {
  fetchShadowWar();
  fetchAccursedTower();
  fetchMemberCount();
  fetchNextShadowWar();
  fetchNextAccursedTower();
  fetchCyclesTotal();
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
    value: formatDate(nextShadowWar.value?.date) ?? 'Sin programar',
    hint: nextShadowWar.value?.enemyClan?.name ? `vs ${nextShadowWar.value.enemyClan.name}` : '',
    to: '/management/shadow-war',
  },
  {
    key: 'next-accursed-tower', icon: 'fas fa-chess-rook', label: 'Próxima Torre Maldita',
    value: formatDate(nextAccursedTower.value?.date) ?? 'Sin programar',
    hint: nextAccursedTower.value?.towerNumber ? `torre #${nextAccursedTower.value.towerNumber}` : '',
    to: '/management/accursed-tower',
  },
]);

// Cards que son hijas de Estadísticas (Overview) van abajo de los gráficos.
const bottomCards = computed(() => [
  { key: 'shadow-wars',    icon: 'fas fa-khanda',        label: 'Guerra Sombría', value: `${winRate(swData.value)}%`, hint: resultBreakdown(swData.value), to: { name: 'ManagementOverviewShadowWars' } },
  { key: 'accursed-tower', icon: 'fas fa-chess-rook',    label: 'Torre Maldita',  value: `${winRate(atData.value)}%`, hint: resultBreakdown(atData.value), to: { name: 'ManagementOverviewAccursedTower' } },
  { key: 'cycles',         icon: 'fas fa-calendar-days', label: 'Ciclos',         value: cyclesTotal.value ?? '—',    hint: 'ciclos definidos', to: { name: 'ManagementOverviewCycles' } },
]);
</script>

<template>
  <div class="statistics-overview">
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
            v-for="r in RANGES"
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
            v-for="r in RANGES"
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
