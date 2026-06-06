<script setup lang="ts">
import { PropType, computed } from 'vue';
import { Character } from '../../../../interfaces';
import ConfirmStatusIcon from '../../common/ConfirmStatusIcon.vue';
import ClassImage from '../../common/ClassImage.vue';

const props = defineProps({
  character:          { type: Object as PropType<Character | undefined>, default: undefined },
  showUnassignButton: { type: Boolean, default: false },
  confirmedIds:       { type: Array as PropType<string[]>, default: () => [] },
  declinedIds:        { type: Array as PropType<string[]>, default: () => [] },
  canConfirm:         { type: Boolean, default: false },
  confirming:         { type: Boolean, default: false },
});

defineEmits<{
  (e: 'respond', action: 'confirm' | 'decline' | 'pending'): void;
  (e: 'click'): void;
  (e: 'unassign'): void;
}>();

const status = computed<'confirmed' | 'declined' | 'pending' | null>(() => {
  const id = props.character?._id;
  if (!id) return null;
  if (props.confirmedIds.includes(id)) return 'confirmed';
  if (props.declinedIds.includes(id))  return 'declined';
  if (props.showUnassignButton) return 'pending';
  return null;
});
</script>

<template>
  <div class="character-card" @click="$emit('click')">
    <div v-if="character" class="character-info">
      <button v-if="showUnassignButton" class="unassign-button" @click.stop="$emit('unassign')">×</button>
      <ClassImage :current-class="character.currentClass" />
      <div class="character-details">
        <span class="character-name">{{ character.name }}</span>
        <span class="resonance">{{ character!.score?.toLocaleString('es') ?? '—' }}</span>
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
      <span>+</span>
      <span>Asignar</span>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./AccursedTowerMemberCard.scss" />
