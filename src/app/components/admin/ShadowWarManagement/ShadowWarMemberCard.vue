<script setup lang="ts">
import { PropType } from 'vue';
import { Character } from '../../../../interfaces';
import { classes } from '../../../../middlewares/misc/const';

defineProps({
  character: {
    type: Object as PropType<Character | undefined>,
    default: undefined
  },
  showUnassignButton: {
    type: Boolean,
    default: false
  }
});

const getClassImage = (className: string | undefined) => {
  const foundClass = classes.find(c => c.value === className);
  return foundClass ? foundClass.image : '';
};
</script>

<template>
  <div class="character-card" @click="$emit('click')">
    <div v-if="character" class="character-info">
      <div class="class-details">
        <button v-if="showUnassignButton" class="unassign-button" @click.stop="$emit('unassign')">×</button>
        <img :src="getClassImage(character.currentClass)" :alt="character.currentClass" class="class-image" />
      </div>
      <div class="character-details">
        <span class="character-name">{{ character.name }}</span>
        <small><span class="resonance">{{ character.resonance }}</span></small>
      </div>
    </div>
    <div v-else class="empty-card">
      <span>+</span>
      <span>Asignar Miembro</span>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./ShadowWarMemberCard.scss" />
