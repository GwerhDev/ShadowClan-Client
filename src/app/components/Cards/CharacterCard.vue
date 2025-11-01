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
  <div class="character-card" :class="{ 'linked-member': isLinked }">
    <div v-if="character" class="member-info">
      <img v-if="character.currentClass" :src="getClassImage(character!.currentClass)" :title="character!.currentClass" :alt="character!.currentClass"
        class="class-image" />
      <i v-else class="fas fa-question"></i>
      <div class="member-details">
        <h4 class="character-name">{{ character!.name }}</h4>
        <p class="resonance">{{ character!.resonance }}</p>
      </div>
      <h4 v-if="character!.clan?.name" class="clan-name" :title="character!.clan?.name">{{ character!.clan?.name }}</h4>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./CharacterCard.scss" />
