<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '../../../../middlewares/store';
import TableComponent from '../../Tables/TableComponent.vue';
import EmptyState from '../../common/EmptyState.vue';
import { getAttendanceCycles, createAttendanceCycle, updateAttendanceCycle, deleteAttendanceCycle } from '../../../../middlewares/services';

type ActivityType = 'shadow' | 'immortal';
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

const form = ref({ startDate: '', endDate: '', activityType: 'shadow' as ActivityType });
const cycleStatus = ref<'vigente' | 'finalizado'>('vigente');

watch(cycleStatus, (status) => {
  if (status === 'vigente') form.value.endDate = '';
});

const MIN_CYCLE_WEEKS = 4;
const MAX_CYCLE_WEEKS = 7;
const MIN_CYCLE_DAYS  = MIN_CYCLE_WEEKS * 7; // 28
const MAX_CYCLE_DAYS  = MAX_CYCLE_WEEKS * 7; // 49

const durationError = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return null; // ciclo abierto: sin restricción
  const start = new Date(form.value.startDate + 'T00:00:00Z').getTime();
  const end   = new Date(form.value.endDate   + 'T00:00:00Z').getTime();
  const days  = Math.round((end - start) / 86400000) + 1;
  if (days < 1) return 'La fecha de fin no puede ser anterior al inicio.';
  if (days < MIN_CYCLE_DAYS || days > MAX_CYCLE_DAYS) {
    return `La duración debe ser de entre ${MIN_CYCLE_WEEKS} y ${MAX_CYCLE_WEEKS} semanas (actual: ${days} días).`;
  }
  return null;
});

// ── Finalizar ciclo (setear endDate en uno abierto) ──
const finishingId = ref<string | null>(null);
const finishDate  = ref('');
const finishing   = ref(false);
const finishError = ref<string | null>(null);

const navItems = ['actividad', 'inicio', 'fin', 'acciones'];

function formatDate(d: string | Date) {
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

function activityLabel(t: ActivityType) { return t === 'immortal' ? 'Guerra Inmortal' : 'Guerra Sombría'; }
function activityIcon(t: ActivityType)  { return t === 'immortal' ? 'fas fa-crown' : 'fas fa-khanda'; }

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
  if (!form.value.startDate || (cycleStatus.value === 'finalizado' && !form.value.endDate) || durationError.value) return;
  saving.value = true;
  try {
    const payload = {
      startDate: form.value.startDate,
      activityType: form.value.activityType,
      ...(form.value.endDate ? { endDate: form.value.endDate } : {}),
    };
    await createAttendanceCycle(payload, characterId.value);
    form.value     = { startDate: '', endDate: '', activityType: 'shadow' };
    cycleStatus.value = 'vigente';
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

function startFinish(cycle: any) {
  finishingId.value = cycle._id;
  finishDate.value  = new Date().toISOString().slice(0, 10);
  finishError.value = null;
}
function cancelFinish() {
  finishingId.value = null;
  finishDate.value  = '';
  finishError.value = null;
}
async function confirmFinish(cycle: any) {
  if (!finishDate.value) return;
  finishing.value   = true;
  finishError.value = null;
  try {
    const updated = await updateAttendanceCycle(cycle._id, { endDate: finishDate.value }, characterId.value);
    const idx = cycles.value.findIndex(c => c._id === cycle._id);
    if (idx !== -1) cycles.value[idx] = updated;
    cancelFinish();
  } catch (e: any) {
    finishError.value = e?.response?.data?.message ?? 'No se pudo finalizar el ciclo.';
  } finally {
    finishing.value = false;
  }
}

function openReport(cycle: any) {
  if (cycle.activityType !== 'shadow') return;
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
            <option value="shadow">Guerra Sombría</option>
            <option value="immortal">Guerra Inmortal</option>
          </select>
        </div>
        <div class="cycle-form-field">
          <label>Inicio</label>
          <input type="date" v-model="form.startDate" />
        </div>
        <div class="cycle-form-field">
          <label>Estado</label>
          <select v-model="cycleStatus">
            <option value="vigente">Vigente</option>
            <option value="finalizado">Finalizado</option>
          </select>
        </div>
        <div v-if="cycleStatus === 'finalizado'" class="cycle-form-field">
          <label>Fin</label>
          <input type="date" v-model="form.endDate" />
        </div>
        <span v-if="durationError" class="cycle-form-error">{{ durationError }}</span>
        <button
          class="btn-save-cycle"
          :disabled="saving || !!durationError || !form.startDate || (cycleStatus === 'finalizado' && !form.endDate)"
          @click="handleCreate"
        >
          <i class="fas fa-check"></i> Crear
        </button>
      </div>

      <EmptyState v-if="loading" icon="fas fa-spinner fa-spin" message="Cargando ciclos..." :compact="true" />

      <TableComponent v-else :navItems="navItems">
        <template #header>
          <li class="th-cell">
            <select v-model="filter" class="type-filter-select" :class="{ active: filter !== 'all' }">
              <option value="all">Todas</option>
              <option value="shadow">Guerra Sombría</option>
              <option value="immortal">Guerra Inmortal</option>
            </select>
          </li>
          <li class="th-cell">inicio</li>
          <li class="th-cell">fin</li>
          <li class="th-cell">acciones</li>
        </template>

        <div
          v-for="cycle in cycles"
          :key="cycle._id"
          class="cycle-row"
          :class="{ 'cycle-row--no-report': cycle.activityType !== 'shadow' }"
          @click="openReport(cycle)"
        >
          <span>
            <span class="activity-badge">
              <i :class="activityIcon(cycle.activityType)"></i> {{ activityLabel(cycle.activityType) }}
            </span>
          </span>
          <span class="cycle-date">{{ formatDate(cycle.startDate) }}</span>
          <span @click.stop>
            <input v-if="finishingId === cycle._id" type="date" v-model="finishDate" class="finish-date-input" />
            <span v-else-if="cycle.endDate" class="cycle-date">{{ formatDate(cycle.endDate) }}</span>
            <span v-else class="status-badge status-badge--open">En curso</span>
          </span>
          <span @click.stop>
            <template v-if="finishingId === cycle._id">
              <button class="icon-button icon-button--confirm" :disabled="finishing || !finishDate" @click="confirmFinish(cycle)" title="Confirmar">
                <i v-if="finishing" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-check"></i>
              </button>
              <button class="icon-button" :disabled="finishing" @click="cancelFinish" title="Cancelar">
                <i class="fas fa-xmark"></i>
              </button>
            </template>
            <template v-else>
              <button v-if="!cycle.endDate" class="icon-button" @click="startFinish(cycle)" title="Finalizar ciclo">
                <i class="fas fa-flag-checkered"></i>
              </button>
              <button class="icon-button icon-button--danger" :disabled="deletingId === cycle._id" @click="handleDelete(cycle._id)" title="Eliminar">
                <i class="fas fa-trash"></i>
              </button>
            </template>
          </span>
          <span v-if="finishError && finishingId === cycle._id" class="finish-error">{{ finishError }}</span>
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
