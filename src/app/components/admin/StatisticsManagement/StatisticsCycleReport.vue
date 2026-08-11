<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { useStore } from '../../../../middlewares/store';
import TableComponent from '../../Tables/TableComponent.vue';
import EmptyState from '../../common/EmptyState.vue';
import { getAttendanceCycleReport } from '../../../../middlewares/services';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const route  = useRoute();
const router = useRouter();
const store  = useStore();

const chars       = computed(() => (store as any).currentUser.userData?.character ?? []);
const active      = computed(() => (chars.value as any[]).find((c: any) => c._id === (store as any).currentCharacter) ?? chars.value[0] ?? null);
const characterId = computed(() => active.value?._id ?? (store as any).currentCharacter);

const loading = ref(true);
const report  = ref<any>(null);

const navItems = ['miembro', 'rol', 'asistió', 'total guerras', '%'];

function roleLabel(r: string) { return r === 'leader' ? 'Líder' : r === 'officer' ? 'Oficial' : 'Miembro'; }
function formatDate(d: string | Date) {
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const chartHeight = computed(() => `${Math.max(240, (report.value?.members?.length ?? 0) * 34)}px`);

const chartData = computed(() => {
  const members = report.value?.members ?? [];
  return {
    labels: members.map((m: any) => m.name),
    datasets: [{
      label: '% de asistencia',
      data: members.map((m: any) => m.percentage),
      backgroundColor: 'rgba(227, 210, 168, .55)',
      borderColor: 'rgba(227, 210, 168, .9)',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };
});

const chartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      min: 0,
      max: 100,
      ticks: { color: 'rgba(255, 255, 255, .5)', callback: (v: any) => `${v}%` },
      grid:  { color: 'rgba(255, 255, 255, .06)' },
    },
    y: {
      ticks: { color: 'rgba(255, 255, 255, .7)' },
      grid:  { color: 'rgba(255, 255, 255, .04)' },
    },
  },
};

async function fetchReport() {
  loading.value = true;
  try {
    report.value = await getAttendanceCycleReport(route.params.cycle_id as string, characterId.value);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchReport);
</script>

<template>
  <div class="cycle-report">
    <button class="btn-back" @click="router.push({ name: 'ManagementStatistics' })">
      <i class="fas fa-arrow-left"></i> Volver a ciclos
    </button>

    <EmptyState v-if="loading" icon="fas fa-spinner fa-spin" message="Cargando reporte..." :compact="true" />

    <template v-else-if="report">
      <div class="cycle-report-header">
        <h3>{{ report.cycle.name }}</h3>
        <span class="cycle-range">{{ formatDate(report.cycle.startDate) }} — {{ formatDate(report.cycle.endDate) }}</span>
        <span class="cycle-count">{{ report.shadowWars.length }} Guerra(s) Sombría(s) en el rango</span>
      </div>

      <EmptyState
        v-if="!report.shadowWars.length"
        icon="fas fa-scroll"
        message="No hay Shadow Wars registradas dentro de este ciclo."
        :compact="true"
      />

      <template v-else>
        <div class="chart-wrapper" :style="{ height: chartHeight }">
          <Bar :data="chartData" :options="chartOptions" />
        </div>

        <TableComponent :navItems="navItems">
          <div v-for="member in report.members" :key="member._id" class="report-row">
            <span class="member-name">{{ member.name }}</span>
            <span><span :class="['role-badge', member.role]">{{ roleLabel(member.role) }}</span></span>
            <span>{{ member.attendedCount }}</span>
            <span>{{ member.totalActivities }}</span>
            <span class="percentage" :class="{ low: member.percentage < 50, high: member.percentage >= 80 }">{{ member.percentage }}%</span>
          </div>
        </TableComponent>
      </template>
    </template>
  </div>
</template>

<style scoped lang="scss" src="./StatisticsCycleReport.scss" />
