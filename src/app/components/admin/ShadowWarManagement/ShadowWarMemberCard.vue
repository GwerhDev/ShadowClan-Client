<script setup lang="ts">
import { PropType, computed } from 'vue';
import { Character } from '../../../../interfaces';
import { classes } from '../../../../middlewares/misc/const';
import ConfirmStatusIcon from '../../common/ConfirmStatusIcon.vue';
import ClassImage from '../../common/ClassImage.vue';
import StatRadarChart from '../../common/StatRadarChart.vue';

const props = defineProps({
  character:          { type: Object as PropType<Character | undefined>, default: undefined },
  showUnassignButton: { type: Boolean, default: false },
  confirmedIds:       { type: Array as PropType<string[]>, default: () => [] },
  declinedIds:        { type: Array as PropType<string[]>, default: () => [] },
  assignedIds:        { type: Array as PropType<string[]>, default: () => [] },
  canConfirm:         { type: Boolean, default: false },
  confirming:         { type: Boolean, default: false },
  readonly:           { type: Boolean, default: false },
  attendancePct:      { type: Number as PropType<number | null>, default: null },
  statMaxes:          { type: Object as PropType<Record<string, number>>, default: () => ({}) },
});

defineEmits<{
  (e: 'respond', action: 'confirm' | 'decline' | 'pending'): void;
  (e: 'click'): void;
  (e: 'unassign'): void;
}>();

const getClassName = (className: string | undefined) =>
  classes.find(c => c.value === className)?.name ?? (className ?? '');

const status = computed<'confirmed' | 'declined' | 'pending' | null>(() => {
  const id = props.character?._id;
  if (!id) return null;
  if (props.confirmedIds.includes(id)) return 'confirmed';
  if (props.declinedIds.includes(id))  return 'declined';
  if (props.showUnassignButton || props.assignedIds.includes(id)) return 'pending';
  return null;
});
</script>

<template>
  <div class="character-card" :class="{ 'character-card--readonly': readonly && !character }" @click="!readonly || character ? $emit('click') : undefined">
    <div v-if="character" class="character-info">
      <button v-if="showUnassignButton" class="unassign-button" @click.stop="$emit('unassign')">×</button>
      <ClassImage :current-class="character.currentClass" />
      <div class="character-details">
        <span class="character-name">{{ character.name }}</span>
        <span class="character-meta">
          <span class="class-name">{{ getClassName(character.currentClass) }}</span>
          <span class="separator">·</span>
          <span class="resonance">{{ character.score?.toLocaleString('es') ?? '—' }}</span>
          <template v-if="attendancePct !== null">
            <span class="separator">·</span>
            <span
              class="attendance-pct"
              :class="{
                'attendance-pct--high': attendancePct >= 75,
                'attendance-pct--mid':  attendancePct >= 40 && attendancePct < 75,
                'attendance-pct--low':  attendancePct < 40,
              }"
            >{{ attendancePct }}%</span>
          </template>
        </span>
      </div>
      <div v-if="canConfirm" class="respond-actions" @click.stop>
        <button
          class="respond-btn respond-btn--confirm"
          :class="{ active: status === 'confirmed' }"
          :disabled="confirming"
          title="Confirmar participación"
          @click="$emit('respond', 'confirm')"
        ><i class="fas fa-check"></i></button>
        <button
          class="respond-btn respond-btn--pending"
          :class="{ active: status === 'pending' }"
          :disabled="confirming"
          title="Marcar como pendiente"
          @click="$emit('respond', 'pending')"
        ><i class="fas fa-clock"></i></button>
        <button
          class="respond-btn respond-btn--decline"
          :class="{ active: status === 'declined' }"
          :disabled="confirming"
          title="Declinar participación"
          @click="$emit('respond', 'decline')"
        ><i class="fas fa-times"></i></button>
      </div>
      <template v-else>
        <StatRadarChart
          v-if="statMaxes.armor"
          :armor="(character as any).armor ?? 0"
          :armor-penetration="(character as any).armorPenetration ?? 0"
          :power="(character as any).power ?? 0"
          :resistance="(character as any).resistance ?? 0"
          :max-armor="statMaxes.armor ?? 1"
          :max-armor-penetration="statMaxes.armorPenetration ?? 1"
          :max-power="statMaxes.power ?? 1"
          :max-resistance="statMaxes.resistance ?? 1"
          :size="64"
        />
        <ConfirmStatusIcon :status="status" />
      </template>
    </div>
    <div v-else class="empty-card">
      <i :class="readonly ? 'fas fa-ban' : 'fas fa-plus'"></i>
      <span>{{ readonly ? 'No asignado' : 'Asignar' }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./ShadowWarMemberCard.scss" />
