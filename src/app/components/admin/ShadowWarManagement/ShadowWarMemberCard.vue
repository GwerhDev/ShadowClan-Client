<script setup lang="ts">
import { PropType, computed } from 'vue';
import { Character } from '../../../../interfaces';
import { classes } from '../../../../middlewares/misc/const';
import ConfirmStatusIcon from '../../common/ConfirmStatusIcon.vue';
import ClassImage from '../../common/ClassImage.vue';

const props = defineProps({
  character: { type: Object as PropType<Character | undefined>, default: undefined },
  showUnassignButton: { type: Boolean, default: false },
  confirmedIds:  { type: Array as PropType<string[]>, default: () => [] },
  assignedIds:   { type: Array as PropType<string[]>, default: () => [] },
});

const getClassName = (className: string | undefined) =>
  classes.find(c => c.value === className)?.name ?? (className ?? '');

const status = computed<'confirmed' | 'pending' | null>(() => {
  const id = props.character?._id;
  if (!id) return null;
  if (props.confirmedIds.includes(id)) return 'confirmed';
  if (props.showUnassignButton || props.assignedIds.includes(id)) return 'pending';
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
        <span class="character-meta">
          <span class="class-name">{{ getClassName(character.currentClass) }}</span>
          <span class="separator">·</span>
          <span class="resonance">{{ character.resonance }}</span>
        </span>
      </div>
      <ConfirmStatusIcon :status="status" />
    </div>
    <div v-else class="empty-card">
      <span>+</span>
      <span>Asignar</span>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./ShadowWarMemberCard.scss" />
