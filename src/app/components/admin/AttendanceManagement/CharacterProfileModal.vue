<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import CustomModal from '../../Modals/CustomModal.vue';
import ClassImage  from '../../common/ClassImage.vue';
import StatRadarChart from '../../common/StatRadarChart.vue';
import { classes } from '../../../../middlewares/misc/const';
import { updateClanMember, updateMemberRole, removeClanMember } from '../../../../middlewares/services';

const props = defineProps<{
  member:        any;
  attendancePct: number | null;
  clanId?:       string;
  isLeader?:     boolean;
  isOfficer?:    boolean;
}>();

const emit = defineEmits<{ close: []; refresh: [] }>();

// ── Editar / eliminar (mismas acciones que el listado de miembros) ──────────
const canManage = computed(() => !!props.clanId && (props.isLeader || props.isOfficer));
const canDelete = computed(() =>
  !!props.clanId && props.member?.role !== 'leader' && (props.isLeader || props.member?.role === 'member')
);

const editionActive = ref(false);
const deleteActive  = ref(false);
const saving        = ref(false);

// Misma arquitectura de edición que ProfileComponent.vue: un único editForm,
// las filas mantienen su layout y solo alternan valor/input in-place.
const editForm = ref({
  currentClass:     '',
  role:             'member' as 'officer' | 'member',
  resonance:        null as number | null,
  armor:            null as number | null,
  armorPenetration: null as number | null,
  power:            null as number | null,
  resistance:       null as number | null,
});

function resetEditFields(m: any) {
  editForm.value = {
    currentClass:     m?.currentClass ?? '',
    role:             m?.role === 'leader' ? 'member' : (m?.role ?? 'member'),
    resonance:        m?.resonance        ?? null,
    armor:            m?.armor            ?? null,
    armorPenetration: m?.armorPenetration ?? null,
    power:            m?.power            ?? null,
    resistance:       m?.resistance       ?? null,
  };
}

watch(() => props.member, resetEditFields, { immediate: true });

function startEdit()   { editionActive.value = true; }
function startDelete() { deleteActive.value  = true; }

function cancelAction() {
  editionActive.value = false;
  deleteActive.value  = false;
  resetEditFields(props.member);
}

async function confirmEdit() {
  saving.value = true;
  try {
    const payload = {
      currentClass:     editForm.value.currentClass || undefined,
      resonance:        editForm.value.resonance        ?? undefined,
      armor:            editForm.value.armor            ?? undefined,
      armorPenetration: editForm.value.armorPenetration ?? undefined,
      power:            editForm.value.power             ?? undefined,
      resistance:       editForm.value.resistance       ?? undefined,
    };
    await updateClanMember(props.clanId, props.member._id, payload);
    if (props.isLeader && props.member.role !== 'leader' && editForm.value.role !== props.member.role) {
      await updateMemberRole(props.clanId, props.member._id, editForm.value.role);
      props.member.role = editForm.value.role;
    }
    Object.assign(props.member, payload);
    editionActive.value = false;
    emit('refresh');
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  saving.value = true;
  try {
    await removeClanMember(props.clanId, props.member._id);
    emit('refresh');
    emit('close');
  } finally {
    saving.value = false;
  }
}

function roleLabel(r: string) {
  return r === 'leader' ? 'Líder' : r === 'officer' ? 'Oficial' : 'Miembro';
}
function statusLabel(s: string) {
  return s === 'activo' ? 'Activo' : s === 'inactivo' ? 'Inactivo' : s === 'retirado' ? 'Retirado' : s === 'pendiente' ? 'Pendiente' : 'Activo';
}
function statusColor(s: string) {
  return s === 'activo' ? '#4ade80' : s === 'inactivo' ? '#f87171' : s === 'retirado' ? '#9ca3af' : '#fbbf24';
}
function pctColor(p: number) {
  return p >= 75 ? '#4ade80' : p >= 40 ? '#fbbf24' : '#f87171';
}

const className = computed(() =>
  classes.find(c => c.value === props.member?.currentClass)?.name ?? props.member?.currentClass ?? '—'
);

const stats = [
  { label: 'Resonancia',   key: 'resonance'        },
  { label: 'Armadura',     key: 'armor'             },
  { label: 'Penetración',  key: 'armorPenetration'  },
  { label: 'Potencia',     key: 'power'             },
  { label: 'Resistencia',  key: 'resistance'        },
];

const hasStats = computed(() =>
  ['armor', 'armorPenetration', 'power', 'resistance'].some(k => (props.member?.[k] ?? 0) > 0)
);
</script>

<template>
  <CustomModal :title="member.name" @close="$emit('close')">
    <div class="cp-modal">

      <!-- Header: class + role + status -->
      <div class="cp-header">
        <ClassImage :current-class="editionActive ? editForm.currentClass : member.currentClass" :size="48" />
        <div class="cp-header__info">
          <span v-if="!editionActive" class="cp-class">{{ className }}</span>
          <select v-else class="cp-class-select" v-model="editForm.currentClass" :disabled="saving">
            <option value="">Sin clase</option>
            <option v-for="cls in classes" :key="cls.value" :value="cls.value">{{ cls.name }}</option>
          </select>

          <div class="cp-badges">
            <select v-if="editionActive && isLeader && member.role !== 'leader'" class="cp-role-select" v-model="editForm.role" :disabled="saving">
              <option value="officer">Oficial</option>
              <option value="member">Miembro</option>
            </select>
            <span v-else class="cp-badge cp-badge--role" :class="member.role">{{ roleLabel(member.role) }}</span>
            <span class="cp-badge cp-badge--status" :style="{ borderColor: statusColor(member.memberStatus ?? 'activo'), color: statusColor(member.memberStatus ?? 'activo') }">
              {{ statusLabel(member.memberStatus ?? 'activo') }}
            </span>
          </div>
        </div>

        <!-- Attendance block -->
        <div v-if="attendancePct !== null" class="cp-attendance">
          <span class="cp-attendance__label">Asistencia<br/>último mes</span>
          <span class="cp-attendance__value" :style="{ color: pctColor(attendancePct) }">{{ attendancePct }}%</span>
        </div>

        <!-- Acciones: editar/eliminar, o guardar/cancelar mientras se edita -->
        <div v-if="canManage && !deleteActive" class="cp-actions">
          <template v-if="!editionActive">
            <button class="icon-button" @click="startEdit" title="Editar"><i class="fas fa-pen"></i></button>
            <button v-if="canDelete" class="icon-button icon-button--danger" @click="startDelete" title="Eliminar"><i class="fas fa-trash"></i></button>
          </template>
          <template v-else>
            <button class="icon-button icon-button--confirm" :disabled="saving" @click="confirmEdit" title="Guardar">
              <i v-if="saving" class="fas fa-spinner fa-spin"></i><i v-else class="fas fa-check"></i>
            </button>
            <button class="icon-button" :disabled="saving" @click="cancelAction" title="Cancelar"><i class="fas fa-times"></i></button>
          </template>
        </div>
      </div>

      <!-- Confirmar eliminación -->
      <div v-if="deleteActive" class="cp-delete">
        <p class="cp-delete__text">¿Eliminar a <strong>{{ member.name }}</strong> del clan?</p>
        <div class="cp-edit-actions">
          <button class="icon-button icon-button--confirm" :disabled="saving" @click="confirmDelete" title="Confirmar eliminación"><i class="fas fa-check"></i></button>
          <button class="icon-button" :disabled="saving" @click="cancelAction" title="Cancelar"><i class="fas fa-times"></i></button>
        </div>
      </div>

      <!-- Radar + stats: cada fila alterna valor/input in-place, igual que en el perfil -->
      <div v-else class="cp-body">
        <div v-if="hasStats || editionActive" class="cp-radar-wrap">
          <StatRadarChart
            :armor="editionActive ? (editForm.armor ?? 0) : (member.armor ?? 0)"
            :armor-penetration="editionActive ? (editForm.armorPenetration ?? 0) : (member.armorPenetration ?? 0)"
            :power="editionActive ? (editForm.power ?? 0) : (member.power ?? 0)"
            :resistance="editionActive ? (editForm.resistance ?? 0) : (member.resistance ?? 0)"
            :size="160"
          />
        </div>

        <div class="cp-stats">
          <div class="cp-stat-row" v-for="s in stats" :key="s.key">
            <span class="cp-stat-label">{{ s.label }}</span>
            <span v-if="!editionActive" class="cp-stat-value">{{ (member[s.key] ?? 0) > 0 ? Number(member[s.key]).toLocaleString('es') : '—' }}</span>
            <input v-else type="number" class="cp-stat-value cp-stat-edit-input" v-model.number="(editForm as any)[s.key]" min="0" :disabled="saving" placeholder="—" />
          </div>
          <div class="cp-stat-row cp-stat-row--total">
            <span class="cp-stat-label">Puntaje</span>
            <span class="cp-stat-value cp-stat-value--gold">{{ (member.score ?? 0) > 0 ? Number(member.score).toLocaleString('es') : '—' }}</span>
          </div>
        </div>
      </div>

    </div>
  </CustomModal>
</template>

<style scoped lang="scss">
.cp-modal {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

// ── Header ──────────────────────────────────────────────────────────────────
.cp-header {
  display: flex;
  align-items: center;
  gap: .9rem;

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: .35rem;
    min-width: 0;
  }
}

.cp-class {
  font-size: .78rem;
  color: rgba(255, 255, 255, .4);
  letter-spacing: .04em;
}

.cp-class-select {
  align-self: flex-start;
  height: 26px;
  padding: 0 .5rem;
  font-size: .78rem;
}

.cp-role-select {
  height: 22px;
  padding: 0 .4rem;
  font-size: .68rem;
}

.cp-badges {
  display: flex;
  gap: .4rem;
  flex-wrap: wrap;
}

.cp-badge {
  font-size: .62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  padding: .1rem .45rem;
  border-radius: 4px;

  &--role {
    &.leader  { background: rgba(227,210,168,.12); color: rgb(227,210,168);  border: 1px solid rgba(227,210,168,.3); }
    &.officer { background: rgba(147,197,253,.1);  color: #93c5fd;           border: 1px solid rgba(147,197,253,.25); }
    &.member  { background: rgba(255,255,255,.06); color: rgba(255,255,255,.5); border: 1px solid rgba(255,255,255,.12); }
  }

  &--status {
    background: transparent;
    border: 1px solid;
    border-radius: 4px;
  }
}

.cp-attendance {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .15rem;
  flex-shrink: 0;

  &__label {
    font-size: .62rem;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: rgba(255, 255, 255, .3);
    text-align: center;
    line-height: 1.3;
  }

  &__value {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
  }
}

// ── Acciones: editar / eliminar ─────────────────────────────────────────────
.cp-actions {
  display: flex;
  align-items: center;
  gap: .4rem;
  flex-shrink: 0;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, .12);
  color: rgba(255, 255, 255, .5);
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;

  &:hover:not(:disabled) {
    color: rgb(227, 210, 168);
    background: rgba(255, 255, 255, .05);
    border-color: rgba(227, 210, 168, .35);
  }

  &:disabled { opacity: .35; cursor: not-allowed; }

  &--danger {
    color: rgba(248, 113, 113, .65);
    border-color: rgba(239, 68, 68, .2);

    &:hover:not(:disabled) {
      color: #f87171;
      background: rgba(239, 68, 68, .06);
      border-color: rgba(239, 68, 68, .4);
    }
  }

  &--confirm {
    color: #4ade80;
    border-color: rgba(34, 197, 94, .3);

    &:hover:not(:disabled) {
      color: #4ade80;
      background: rgba(34, 197, 94, .06);
      border-color: rgba(34, 197, 94, .5);
    }
  }
}

.cp-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: .5rem;
}

.cp-delete {
  display: flex;
  flex-direction: column;
  gap: .9rem;

  &__text {
    margin: 0;
    font-size: .88rem;
    color: rgba(255, 255, 255, .7);
  }
}

// ── Body (radar + stat list) ─────────────────────────────────────────────────
.cp-body {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.cp-radar-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cp-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.cp-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: .38rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, .05);

  &--total {
    border-bottom: none;
    padding-top: .55rem;
  }
}

.cp-stat-label {
  font-size: .72rem;
  color: rgba(255, 255, 255, .35);
  text-transform: uppercase;
  letter-spacing: .06em;
}

.cp-stat-value {
  font-size: .9rem;
  color: rgba(255, 255, 255, .8);
  font-weight: 500;

  &--gold {
    color: rgba(227, 210, 168, .9);
    font-size: 1rem;
    font-weight: 700;
  }
}

.cp-stat-edit-input {
  width: 100px;
  height: 26px;
  padding: 0 .5rem;
  font-size: .82rem;
  text-align: right;
}
</style>
