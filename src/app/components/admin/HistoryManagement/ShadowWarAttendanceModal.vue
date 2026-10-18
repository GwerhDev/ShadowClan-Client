<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from '../../../../middlewares/store';
import { getShadowWarAttendance, setMemberAttendance } from '../../../../middlewares/services';
import type { AttendanceMember, AttendanceStatusFilter, ShadowWarAttendance } from '../../../../interfaces';
import ClassImage from '../../common/ClassImage.vue';
import CharacterProfileModal from '../AttendanceManagement/CharacterProfileModal.vue';

/**
 * Asistencia de una instancia de Guerra Sombría: lista los miembros del clan con
 * buscador y filtro por estado (filtrados en el backend) y permite marcar/desmarcar
 * la asistencia de esa instancia, igual que en /management/attendance.
 */
const props = withDefaults(defineProps<{ shadowWarId: string; kind?: 'shadow_war' | 'vigil_of_blades' }>(), { kind: 'shadow_war' });
const emit  = defineEmits<{ (e: 'close'): void; (e: 'updated'): void }>();

const store = useStore();

const STATUS_OPTIONS: { value: AttendanceStatusFilter; label: string }[] = [
  { value: 'all',      label: 'Todos' },
  { value: 'attended', label: 'Asistieron' },
  { value: 'unmarked', label: 'Sin marcar' },
];
const ROLE_LABEL: Record<string, string> = { leader: 'Líder', officer: 'Oficial', member: 'Miembro' };

const loading      = ref(true);
const error        = ref('');
const searchQuery  = ref('');
const statusFilter = ref<AttendanceStatusFilter>('all');
const members      = ref<AttendanceMember[]>([]);
const summary      = ref<ShadowWarAttendance['summary']>({ total: 0, attended: 0, unmarked: 0 });
const savingIds    = ref<Set<string>>(new Set());
const selectedMember = ref<AttendanceMember | null>(null);
let   searchDebounce: ReturnType<typeof setTimeout> | null = null;

const attendancePct = computed(() =>
  summary.value.total ? Math.round((summary.value.attended / summary.value.total) * 100) : 0);

async function load() {
  loading.value = true;
  error.value   = '';
  try {
    const res = await getShadowWarAttendance(props.shadowWarId, store.currentCharacter ?? undefined, {
      q: searchQuery.value.trim() || undefined,
      status: statusFilter.value,
    }, props.kind);
    members.value = res.members;
    summary.value = res.summary;
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'No se pudo cargar la asistencia.';
  } finally {
    loading.value = false;
  }
}

/** Ajusta los conteos localmente al marcar/desmarcar (asistió ↔ sin marcar). */
function bumpSummary(nowAttended: boolean) {
  summary.value.attended += nowAttended ? 1 : -1;
  summary.value.unmarked += nowAttended ? -1 : 1;
}

async function toggle(member: AttendanceMember) {
  if (savingIds.value.has(member._id)) return;
  const prev = member.attended;
  const next = !(prev === true);
  savingIds.value.add(member._id);
  try {
    await setMemberAttendance(props.shadowWarId, member._id, next, store.currentCharacter ?? undefined, props.kind);
    member.attended = next;
    if ((prev === true) !== next) bumpSummary(next);
    // Con un filtro de estado activo, el miembro deja de corresponder a la vista.
    if (statusFilter.value !== 'all') members.value = members.value.filter(m => m._id !== member._id);
    emit('updated');
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'No se pudo guardar la asistencia.';
  } finally {
    savingIds.value.delete(member._id);
  }
}

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(load, 400);
});
watch(statusFilter, load);

onMounted(load);
</script>

<template>
  <Teleport to="body">
    <div class="swa-overlay" @click.self="emit('close')">
      <div class="swa-modal">
        <div class="swa-header">
          <span class="swa-title"><i class="fas fa-clipboard-check"></i> Asistencia</span>
          <button class="swa-close" @click="emit('close')" title="Cerrar"><i class="fas fa-times"></i></button>
        </div>

        <div class="swa-summary">
          <span class="swa-chip swa-chip--ok"><i class="fas fa-check"></i> {{ summary.attended }} asistieron</span>
          <span class="swa-chip"><i class="fas fa-minus"></i> {{ summary.unmarked }} sin marcar</span>
          <span class="swa-pct">{{ attendancePct }}%</span>
        </div>

        <div class="swa-toolbar">
          <div class="search-wrap">
            <i class="fas fa-magnifying-glass search-icon"></i>
            <input v-model="searchQuery" class="search-input" placeholder="Buscar miembro..." />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
          <select v-model="statusFilter" class="status-select">
            <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <p v-if="error" class="swa-error">{{ error }}</p>

        <div class="swa-body">
          <template v-if="loading">
            <div v-for="n in 6" :key="n" class="swa-row-skeleton skeleton-box"></div>
          </template>

          <div v-else-if="!members.length" class="swa-empty">
            <i class="fas fa-users-slash"></i>
            <span>{{ searchQuery ? `Sin resultados para "${searchQuery}".` : 'No hay miembros para este filtro.' }}</span>
          </div>

          <div v-else v-for="member in members" :key="member._id" class="swa-row">
            <span class="swa-member" @click="selectedMember = member" title="Ver detalle">
              <ClassImage :current-class="member.currentClass" :size="28" />
              <span class="swa-member-info">
                <span class="swa-member-name">{{ member.name }}</span>
                <span class="swa-member-role">{{ ROLE_LABEL[member.role] ?? member.role }}</span>
              </span>
            </span>
            <span class="swa-state" :class="{ 'swa-state--ok': member.attended === true }">
              {{ member.attended === true ? 'Asistió' : 'Sin marcar' }}
            </span>
            <i v-if="savingIds.has(member._id)" class="fas fa-spinner fa-spin swa-spinner"></i>
            <input
              v-else
              type="checkbox"
              class="swa-check"
              :checked="member.attended === true"
              @change="toggle(member)"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <CharacterProfileModal
    v-if="selectedMember"
    :member="selectedMember"
    @close="selectedMember = null"
  />
</template>

<style scoped lang="scss" src="./ShadowWarAttendanceModal.scss" />
