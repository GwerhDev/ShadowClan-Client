<script setup lang="ts">
import { PropType, computed } from 'vue';
import { Character } from '../../../interfaces';
import { classes } from '../../../middlewares/misc/const';
import ConfirmStatusIcon from '../common/ConfirmStatusIcon.vue';
import ClassImage from '../common/ClassImage.vue';

const props = defineProps({
  character: {
    type: Object as PropType<Character | undefined>,
    default: undefined,
  },
  isLinked: {
    type: Boolean,
    default: false,
  },
  confirmedIds: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  declinedIds: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  canConfirm: {
    type: Boolean,
    default: false,
  },
  confirming: {
    type: Boolean,
    default: false,
  },
});

defineEmits<{
  (e: 'respond', action: 'confirm' | 'decline' | 'pending'): void;
}>();

const getClassName = (className: string | undefined) =>
  classes.find(c => c.value === className)?.name ?? (className ?? '');

const status = computed<'confirmed' | 'declined' | 'pending' | null>(() => {
  const id = props.character?._id;
  if (!id) return null;
  if (props.confirmedIds.includes(id)) return 'confirmed';
  if (props.declinedIds.includes(id))  return 'declined';
  return 'pending';
});
</script>

<template>
  <div class="character-card" :class="{ 'linked-character': isLinked }">
    <div v-if="character" class="character-info">
      <ClassImage :current-class="character.currentClass" />
      <div class="character-details">
        <span class="character-name">{{ character.name }}</span>
        <span class="character-meta">
          <span class="class-name">{{ getClassName(character.currentClass) }}</span>
          <span class="separator">·</span>
          <span class="resonance">{{ character.score?.toLocaleString('es') ?? '—' }}</span>
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
      <ConfirmStatusIcon v-else :status="status" />
    </div>
    <div v-else class="empty-card">
      <i class="fas fa-ban"></i>
      <span>No asignado</span>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./ShadowWarMemberCard.scss" />
