<script setup lang="ts">
import { PropType, ref, computed, onMounted, watch } from 'vue';
import { Character } from '../../../../interfaces';
import ShadowWarMemberCard from './ShadowWarMemberCard.vue';
import CustomModal from '../../Modals/CustomModal.vue';
import { getClanMembersAttendanceSummary } from '../../../../middlewares/services';

interface AssignedDetail {
  label: string;
  category: string;
  matchIndex: number;
  group: string;
  memberIndex: number;
}

const props = defineProps({
  characters: {
    type: Array as PropType<Character[]>,
    required: true
  },
  assignedMemberIds: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  confirmedIds: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  assignedDetails: {
    type: Object as PropType<Record<string, AssignedDetail>>,
    default: () => ({})
  },
  characterId: {
    type: String as PropType<string | undefined>,
    default: undefined
  },
});

const emit = defineEmits(['close', 'character-selected', 'character-unassigned']);

const search      = ref('');
const searchInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
  searchInput.value?.focus();
  fetchAttendanceStats();
});

const filteredCharacters = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return props.characters;
  return props.characters.filter(c => c.name?.toLowerCase().includes(q));
});

const isAssigned = (memberId: string) => props.assignedMemberIds.includes(memberId);

const handleCardClick = (character: Character) => {
  if (isAssigned(character._id)) {
    emit('character-unassigned', character._id);
    return;
  }
  emit('character-selected', character);
  emit('close');
};

// ── Asistencia: filtro 30d/60d/90d/último ciclo ─────────────────────────────
type Range = '30' | '60' | '90' | 'cycle';

const attendanceRange        = ref<Range>('30');
const attendanceRangeTouched = ref(false);
const attendanceStats        = ref<Record<string, { percentage: number; attended: number; totalActivities: number }>>({});
const attendanceHasCycle     = ref(false);
const attendanceCycleIsOpen  = ref(false);

const RANGES = computed<Array<{ value: Range; label: string }>>(() => [
  { value: '30',    label: '30d' },
  { value: '60',    label: '60d' },
  { value: '90',    label: '90d' },
  { value: 'cycle', label: attendanceCycleIsOpen.value ? 'Ciclo actual' : 'Último ciclo' },
]);

async function fetchAttendanceStats() {
  if (!props.characterId) return;
  try {
    const res = await getClanMembersAttendanceSummary(props.characterId, attendanceRange.value);
    attendanceStats.value       = res?.data ?? {};
    attendanceHasCycle.value    = !!res?.hasCycle;
    attendanceCycleIsOpen.value = !!res?.cycleIsOpen;
    if (!attendanceRangeTouched.value && attendanceHasCycle.value && attendanceRange.value !== 'cycle') {
      attendanceRange.value = 'cycle';
    }
  } catch {
    attendanceStats.value = {};
  }
}

function selectAttendanceRange(r: Range) {
  if (r === 'cycle' && !attendanceHasCycle.value) return;
  attendanceRangeTouched.value = true;
  attendanceRange.value = r;
}

watch(attendanceRange, fetchAttendanceStats);
</script>

<template>
  <CustomModal title="Seleccionar Miembro" @close="$emit('close')">

    <div class="member-search-bar">
      <i class="fas fa-search"></i>
      <input ref="searchInput" v-model="search" type="text" placeholder="Buscar miembro..." />
    </div>

    <div v-if="characterId" class="attendance-range-bar">
      <span class="attendance-range-label">Asistencia</span>
      <div class="range-filters">
        <button
          v-for="r in RANGES"
          :key="r.value"
          class="range-btn"
          :class="{ active: attendanceRange === r.value }"
          :disabled="r.value === 'cycle' && !attendanceHasCycle"
          :title="r.value === 'cycle' && !attendanceHasCycle ? 'El clan no tiene ciclos de Guerra Sombría definidos' : ''"
          @click="selectAttendanceRange(r.value)"
        >{{ r.label }}</button>
      </div>
    </div>

    <div v-if="filteredCharacters.length" class="characters-selection-grid">
      <div v-for="character in filteredCharacters" :key="character._id" class="member-grid-item">
        <ShadowWarMemberCard
          :character="character"
          :confirmed-ids="confirmedIds"
          :assigned-ids="assignedMemberIds"
          :attendance-pct="attendanceStats[character._id]?.percentage ?? null"
          :class="{ 'is-assigned': isAssigned(character._id) }"
          @click="handleCardClick(character)"
        />
        <span v-if="assignedDetails[character._id]" class="group-tag">
          <i class="fas fa-layer-group"></i>
          {{ assignedDetails[character._id].label }}
        </span>
      </div>
    </div>

    <div class="no-characters" v-else>
      <i class="fas fa-ban"></i>
      <span>Sin resultados</span>
    </div>

  </CustomModal>
</template>

<style scoped lang="scss" src="./MemberSelectionModal.scss" />
