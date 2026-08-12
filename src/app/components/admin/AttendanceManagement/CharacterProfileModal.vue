<script setup lang="ts">
import { computed } from 'vue';
import CustomModal from '../../Modals/CustomModal.vue';
import ClassImage  from '../../common/ClassImage.vue';
import StatRadarChart from '../../common/StatRadarChart.vue';
import { classes } from '../../../../middlewares/misc/const';

const props = defineProps<{
  member:       any;
  attendancePct: number | null;
  statMaxes:    Record<string, number>;
}>();

defineEmits<{ close: [] }>();

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
        <ClassImage :current-class="member.currentClass" :size="48" />
        <div class="cp-header__info">
          <span class="cp-class">{{ className }}</span>
          <div class="cp-badges">
            <span class="cp-badge cp-badge--role" :class="member.role">{{ roleLabel(member.role) }}</span>
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
      </div>

      <!-- Radar + stats -->
      <div class="cp-body">
        <div v-if="hasStats" class="cp-radar-wrap">
          <StatRadarChart
            :armor="member.armor ?? 0"
            :armor-penetration="member.armorPenetration ?? 0"
            :power="member.power ?? 0"
            :resistance="member.resistance ?? 0"
            :max-armor="statMaxes.armor ?? 1"
            :max-armor-penetration="statMaxes.armorPenetration ?? 1"
            :max-power="statMaxes.power ?? 1"
            :max-resistance="statMaxes.resistance ?? 1"
            :size="160"
          />
        </div>

        <div class="cp-stats">
          <div class="cp-stat-row" v-for="s in stats" :key="s.key">
            <span class="cp-stat-label">{{ s.label }}</span>
            <span class="cp-stat-value">{{ (member[s.key] ?? 0) > 0 ? Number(member[s.key]).toLocaleString('es') : '—' }}</span>
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
  min-width: 300px;
  max-width: 420px;
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
</style>
