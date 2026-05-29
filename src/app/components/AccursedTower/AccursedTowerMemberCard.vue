<script setup lang="ts">
import { PropType } from 'vue';
import { Character } from '../../../interfaces';
import ClassImage from '../common/ClassImage.vue';

defineProps({
  character: { type: Object as PropType<Character | undefined>, default: undefined },
  isLinked:  { type: Boolean, default: false },
});
</script>

<template>
  <div class="character-card" :class="{ 'linked-character': isLinked }">
    <div v-if="character" class="character-info">
      <ClassImage :current-class="character!.currentClass" :size="30" />
      <div class="character-details">
        <span class="character-name">{{ character!.name }}</span>
        <span class="resonance">{{ character!.resonance }}</span>
      </div>
    </div>
    <div v-else class="empty-card">
      <i class="fas fa-ban"></i>
      <span>No asignado</span>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./AccursedTowerMemberCard.scss" />
