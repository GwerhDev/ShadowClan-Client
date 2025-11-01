<script setup lang="ts">
import { PropType } from 'vue';
import { Character } from '../../../interfaces';
import { classes } from '../../../middlewares/misc/const';

defineProps({
  character: {
    type: Object as PropType<Character | undefined>,
    default: undefined,
  },
  isLinked: {
    type: Boolean,
    default: false,
  },
});

const getClassImage = (className: string | undefined) => {
  const foundClass = classes.find(c => c.value === className);
  return foundClass ? foundClass.image : '';
};
</script>

<template>
  <div class="character-card" :class="{ 'linked-character': isLinked }">
    <div v-if="character" class="character-info">
      <img :src="getClassImage(character!.name)" :alt="character!.name" class="class-image" />
      <div class="character-details">
        <span class="character-name">{{ character!.name }}</span>
      </div>
    </div>
    <div v-else class="empty-card">
      <i class="fas fa-ban"></i>
      <span>No asignado</span>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./ShadowWarMemberCard.scss" />
