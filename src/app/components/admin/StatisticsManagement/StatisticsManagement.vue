<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '../../../../middlewares/store';
import TableComponent from '../../Tables/TableComponent.vue';
import EmptyState from '../../common/EmptyState.vue';
import { getAttendanceCycles, createAttendanceCycle, deleteAttendanceCycle } from '../../../../middlewares/services';

type ActivityType = 'shadow_war' | 'accursed_tower';
type ActivityFilter = 'all' | ActivityType;

const store  = useStore();
const route  = useRoute();
const router = useRouter();

const chars       = computed(() => (store as any).currentUser.userData?.character ?? []);
const active      = computed(() => (chars.value as any[]).find((c: any) => c._id === (store as any).currentCharacter) ?? chars.value[0] ?? null);
const characterId = computed(() => active.value?._id ?? (store as any).currentCharacter);

const loading  = ref(true);
const cycles   = ref<any[]>([]);
const showForm = ref(false);
const saving   = ref(false);
const deletingId = ref<string | null>(null);
const filter   = ref<ActivityFilter>('all');

const form = ref({ name: '', startDate: '', endDate: '', activityType: 'shadow_war' as ActivityType });

const navItems = ['actividad', 'nombre', 'inicio', 'fin', 'acciones'];

function formatDate(d: string | Date) {
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function activityLabel(t: ActivityType) { return t === 'accursed_tower' ? 'Torre Maldita' : 'Guerra Sombría'; }
function activityIcon(t: ActivityType)  { return t === 'accursed_tower' ? 'fas fa-chess-rook' : 'fas fa-khanda'; }

async function fetchCycles() {
  loading.value = true;
  try {
    const response = await getAttendanceCycles(1, characterId.value, filter.value === 'all' ? undefined : filter.value);
    cycles.value = response.data ?? [];
  } finally {
    loading.value = false;
  }
}

watch(filter, fetchCycles);

async function handleCreate() {
  if (!form.value.name.trim() || !form.value.startDate || !form.value.endDate) return;
  saving.value = true;
  try {
    await createAttendanceCycle({ ...form.value, name: form.value.name.trim() }, characterId.value);
    form.value    = { name: '', startDate: '', endDate: '', activityType: 'shadow_war' };
    showForm.value = false;
    await fetchCycles();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(cycleId: string) {
  deletingId.value = cycleId;
  try {
    await deleteAttendanceCycle(cycleId, characterId.value);
    cycles.value = cycles.value.filter(c => c._id !== cycleId);
  } finally {
    deletingId.value = null;
  }
}

function openReport(cycle: any) {
  if (cycle.activityType !== 'shadow_war') return;
  router.push({ name: 'ManagementOverviewCycleReport', params: { cycle_id: cycle._id } });
}

onMounted(fetchCycles);
</script>

<template>
  <div class="statistics-management">
    <router-view v-if="route.params.cycle_id" />
    <template v-else>
      <button class="btn-back" @click="router.push('/management/overview')">
        <i class="fas fa-arrow-left"></i> Volver a estadísticas
      </button>

      <div class="cycles-toolbar">
        <button class="btn-add-cycle" @click="showForm = !showForm">
          <i class="fas fa-plus"></i> Nuevo ciclo
        </button>
      </div>

      <div v-if="showForm" class="cycle-form">
        <div class="cycle-form-field">
          <label>Actividad</label>
          <select v-model="form.activityType">
            <option value="shadow_war">Guerra Sombría</option>
            <option value="accursed_tower">Torre Maldita</option>
          </select>
        </div>
        <div class="cycle-form-field">
          <label>Nombre</label>
          <input type="text" v-model="form.name" placeholder="Ej. Ciclo Agosto 2026" />
        </div>
        <div class="cycle-form-field">
          <label>Inicio</label>
          <input type="date" v-model="form.startDate" />
        </div>
        <div class="cycle-form-field">
          <label>Fin</label>
          <input type="date" v-model="form.endDate" />
        </div>
        <button class="btn-save-cycle" :disabled="saving" @click="handleCreate">
          <i class="fas fa-check"></i> Crear
        </button>
      </div>

      <EmptyState v-if="loading" icon="fas fa-spinner fa-spin" message="Cargando ciclos..." :compact="true" />

      <TableComponent v-else :navItems="navItems">
        <template #header>
          <li class="th-cell">
            <select v-model="filter" class="type-filter-select" :class="{ active: filter !== 'all' }">
              <option value="all">Todas</option>
              <option value="shadow_war">Guerra Sombría</option>
              <option value="accursed_tower">Torre Maldita</option>
            </select>
          </li>
          <li class="th-cell">nombre</li>
          <li class="th-cell">inicio</li>
          <li class="th-cell">fin</li>
          <li class="th-cell">acciones</li>
        </template>

        <div
          v-for="cycle in cycles"
          :key="cycle._id"
          class="cycle-row"
          :class="{ 'cycle-row--no-report': cycle.activityType !== 'shadow_war' }"
          @click="openReport(cycle)"
        >
          <span>
            <span class="activity-badge">
              <i :class="activityIcon(cycle.activityType)"></i> {{ activityLabel(cycle.activityType) }}
            </span>
          </span>
          <span class="cycle-name">{{ cycle.name }}</span>
          <span>{{ formatDate(cycle.startDate) }}</span>
          <span>{{ formatDate(cycle.endDate) }}</span>
          <span @click.stop>
            <button class="icon-button icon-button--danger" :disabled="deletingId === cycle._id" @click="handleDelete(cycle._id)" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </span>
        </div>
        <div v-if="!cycles.length" class="table-empty-row">
          <i class="fas fa-calendar-xmark"></i>
          <span>No hay ciclos creados todavía.</span>
        </div>
      </TableComponent>
    </template>
  </div>
</template>

<style scoped lang="scss" src="./StatisticsManagement.scss" />
