<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useStore } from '../../../../middlewares/store';
import TableComponent from '../../Tables/TableComponent.vue';
import EmptyState from '../../common/EmptyState.vue';
import { translateResult } from '../../../../helpers/lists';
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
const data    = ref<any>(null);

const navItems = ['fecha', 'enemigo', 'resultado'];

function formatDate(d: string | Date) {
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const chartData = computed(() => {
  const s = data.value ?? { victory: 0, defeat: 0, draw: 0 };
  return {
    labels: ['Victoria', 'Derrota', 'Empate'],
    datasets: [{
      data: [s.victory, s.defeat, s.draw],
      backgroundColor: ['#4ade80', '#f87171', '#facc15'],
      borderColor: 'rgba(0,0,0,0)',
      borderWidth: 2,
    }],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { color: 'rgba(255, 255, 255, .65)', boxWidth: 12, padding: 12 } },
  },
};

async function fetchData() {
  loading.value = true;
  try {
    data.value = await getStatisticsOverview(range.value, characterId.value, 'accursed_tower', true);
  } finally {
    loading.value = false;
  }
}

function selectRange(r: Range) {
  if (r === 'cycle' && !data.value?.hasCycle && range.value !== 'cycle') return;
  range.value = r;
}

watch(range, fetchData);
onMounted(fetchData);
</script>

<template>
  <div class="statistics-detail">
    <button class="btn-back" @click="router.push('/management/overview')">
      <i class="fas fa-arrow-left"></i> Volver a estadísticas
    </button>

    <h3 class="detail-title"><i class="fas fa-chess-rook"></i> Torre Maldita</h3>

    <div class="range-filters">
      <button
        v-for="r in RANGES"
        :key="r.value"
        class="range-btn"
        :class="{ active: range === r.value }"
        :disabled="r.value === 'cycle' && !data?.hasCycle"
        :title="r.value === 'cycle' && !data?.hasCycle ? 'El clan no tiene ciclos definidos' : ''"
        @click="selectRange(r.value)"
      >{{ r.label }}</button>
    </div>

    <EmptyState v-if="loading" icon="fas fa-spinner fa-spin" message="Cargando..." :compact="true" />

    <template v-else>
      <div class="chart-card">
        <div class="chart-body">
          <Doughnut :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <EmptyState
        v-if="!data?.matches?.length"
        icon="fas fa-scroll"
        message="No hay Torres Malditas con resultado en este rango."
        :compact="true"
      />

      <TableComponent v-else :navItems="navItems">
        <div v-for="match in data.matches" :key="match._id" class="detail-row">
          <span>{{ formatDate(match.date) }}</span>
          <span>{{ match.enemyClan?.name || '—' }}</span>
          <span><span :class="['result-chip', `result-${match.result}`]">{{ translateResult(match.result) }}</span></span>
        </div>
      </TableComponent>
    </template>
  </div>
</template>

<style scoped lang="scss" src="./StatisticsDetail.scss" />
