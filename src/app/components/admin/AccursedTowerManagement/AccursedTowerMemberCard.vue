<script setup lang="ts">
import { PropType } from 'vue';
import { Character } from '../../../../interfaces';
import ClassImage from '../../common/ClassImage.vue';

defineProps({
  character:         { type: Object as PropType<Character | undefined>, default: undefined },
  showUnassignButton:{ type: Boolean, default: false },
});
</script>

<template>
  <div class="character-card" @click="$emit('click')">
    <div v-if="character" class="character-info">
      <button v-if="showUnassignButton" class="unassign-button" @click.stop="$emit('unassign')">×</button>
      <ClassImage :current-class="character.currentClass" />
      <div class="character-details">
        <span class="character-name">{{ character.name }}</span>
        <span class="resonance">{{ character.resonance }}</span>
      </div>
    </div>
    <div v-else class="empty-card">
      <span>+</span>
      <span>Asignar</span>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./AccursedTowerMemberCard.scss" />
