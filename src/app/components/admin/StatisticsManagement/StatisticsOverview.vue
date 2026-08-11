<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useStore } from '../../../../middlewares/store';
import EmptyState from '../../common/EmptyState.vue';
import { getStatisticsOverview } from '../../../../middlewares/services';

ChartJS.register(ArcElement, Tooltip, Legend);

const store  = useStore();
const router = useRouter();

const chars       = computed(() => (store as any).currentUser.userData?.character ?? []);
const active      = computed(() => (chars.value as any[]).find((c: any) => c._id === (store as any).currentCharacter) ?? chars.value[0] ?? null);
const characterId = computed(() => active.value?._id ?? (store as any).currentCharacter);

type Range = '30' | '60' | '90' | 'cycle';
const RANGES: Array<{ value: Range; label: string }> = [
  { value: '30',    label: '30d' },
  { value: '60',    label: '60d' },
  { value: '90',    label: '90d' },
  { value: 'cycle', label: 'Último ciclo' },
];

const range   = ref<Range>('30');
const loading = ref(true);
const overview = ref<any>(null);

const chartColors = {
  victory: '#4ade80',
  defeat:  '#f87171',
  draw:    '#facc15',
};

function buildChartData(summary: { victory: number; defeat: number; draw: number }) {
  return {
    labels: ['Victoria', 'Derrota', 'Empate'],
    datasets: [{
      data: [summary.victory, summary.defeat, summary.draw],
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

const shadowWarChart     = computed(() => buildChartData(overview.value?.shadowWar ?? { victory: 0, defeat: 0, draw: 0 }));
const accursedTowerChart = computed(() => buildChartData(overview.value?.accursedTower ?? { victory: 0, defeat: 0, draw: 0 }));

function winRate(summary?: { victory: number; total: number }) {
  if (!summary || !summary.total) return 0;
  return Math.round((summary.victory / summary.total) * 100);
}

async function fetchOverview() {
  loading.value = true;
  try {
    overview.value = await getStatisticsOverview(range.value, characterId.value);
  } finally {
    loading.value = false;
  }
}

function selectRange(r: Range) {
  if (r === 'cycle' && !overview.value?.hasCycle && range.value !== 'cycle') return;
  range.value = r;
}

watch(range, fetchOverview);
onMounted(fetchOverview);

const cards = computed(() => [
  { key: 'shadow-wars',    icon: 'fas fa-khanda',     label: 'Guerra Sombría', value: `${winRate(overview.value?.shadowWar)}%`,     hint: '% victorias', to: { name: 'ManagementStatisticsShadowWars' } },
  { key: 'accursed-tower', icon: 'fas fa-chess-rook', label: 'Torre Maldita',  value: `${winRate(overview.value?.accursedTower)}%`, hint: '% victorias', to: { name: 'ManagementStatisticsAccursedTower' } },
  { key: 'cycles',         icon: 'fas fa-calendar-days', label: 'Ciclos',      value: overview.value?.hasCycle ? '✓' : '—',         hint: 'Gestionar ciclos', to: { name: 'ManagementStatisticsCycles' } },
]);
</script>

<template>
  <div class="statistics-overview">
    <div class="range-filters">
      <button
        v-for="r in RANGES"
        :key="r.value"
        class="range-btn"
        :class="{ active: range === r.value }"
        :disabled="r.value === 'cycle' && !overview?.hasCycle"
        :title="r.value === 'cycle' && !overview?.hasCycle ? 'El clan no tiene ciclos definidos' : ''"
        @click="selectRange(r.value)"
      >{{ r.label }}</button>
    </div>

    <EmptyState v-if="loading" icon="fas fa-spinner fa-spin" message="Cargando estadísticas..." :compact="true" />

    <template v-else>
      <div class="charts-row">
        <div class="chart-card">
          <div class="chart-card-header">
            <i class="fas fa-khanda"></i>
            <span>Guerra Sombría</span>
            <span class="chart-total">{{ overview?.shadowWar?.total ?? 0 }} partidas</span>
          </div>
          <div class="chart-body">
            <Doughnut :data="shadowWarChart" :options="chartOptions" />
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card-header">
            <i class="fas fa-chess-rook"></i>
            <span>Torre Maldita</span>
            <span class="chart-total">{{ overview?.accursedTower?.total ?? 0 }} partidas</span>
          </div>
          <div class="chart-body">
            <Doughnut :data="accursedTowerChart" :options="chartOptions" />
          </div>
        </div>
      </div>

      <div class="stat-grid">
        <div v-for="card in cards" :key="card.key" class="stat-card stat-card--link" @click="router.push(card.to)">
          <div class="stat-icon"><i :class="card.icon"></i></div>
          <div class="stat-body">
            <span class="stat-value">{{ card.value }}</span>
            <span class="stat-label">{{ card.label }} · {{ card.hint }}</span>
          </div>
          <i class="fas fa-arrow-right stat-arrow"></i>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss" src="./StatisticsOverview.scss" />
