<script setup lang="ts">
import { PropType, computed } from 'vue';
import { Character } from '../../../interfaces';
import { classes } from '../../../middlewares/misc/const';
import ConfirmStatusIcon from '../common/ConfirmStatusIcon.vue';

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
  canConfirm: {
    type: Boolean,
    default: false,
  },
  confirming: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['confirm']);

const getClassImage = (className: string | undefined) => {
  return classes.find(c => c.value === className)?.image ?? '';
};

const getClassName = (className: string | undefined) => {
  return classes.find(c => c.value === className)?.name ?? (className ?? '');
};

const status = computed<'confirmed' | 'pending' | null>(() => {
  const id = props.character?._id;
  if (!id) return null;
  if (props.confirmedIds.includes(id)) return 'confirmed';
  return 'pending';
});
</script>

<template>
  <div class="character-card" :class="{ 'linked-character': isLinked }">
    <div v-if="character" class="character-info">
      <img :src="getClassImage(character.currentClass)" :alt="character.currentClass" class="class-image" />
      <div class="character-details">
        <span class="character-name">{{ character.name }}</span>
        <span class="character-meta">
          <span class="class-name">{{ getClassName(character.currentClass) }}</span>
          <span class="separator">·</span>
          <span class="resonance">{{ character.resonance }}</span>
        </span>
      </div>
      <button
        v-if="canConfirm && status === 'pending'"
        class="confirm-btn"
        :disabled="confirming"
        @click.stop="$emit('confirm')"
        title="Confirmar participación"
      >
        <i :class="confirming ? 'fas fa-spinner fa-spin' : 'fas fa-check'"></i>
      </button>
      <ConfirmStatusIcon v-else :status="status" />
    </div>
    <div v-else class="empty-card">
      <i class="fas fa-ban"></i>
      <span>No asignado</span>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./ShadowWarMemberCard.scss" />
