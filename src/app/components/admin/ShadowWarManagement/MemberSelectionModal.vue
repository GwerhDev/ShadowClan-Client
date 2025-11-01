<script setup lang="ts">
import { PropType } from 'vue';
import { Character } from '../../../../interfaces';
import ShadowWarMemberCard from './ShadowWarMemberCard.vue';
import CustomModal from '../../Modals/CustomModal.vue';

const props = defineProps({
  characters: {
    type: Array as PropType<Character[]>,
    required: true
  },
  assignedMemberIds: {
    type: Array as PropType<string[]>,
    default: () => []
  }
});

const emit = defineEmits(['close', 'characters-selected']);

const handleCardClick = (characters: Character) => {
  if (props.assignedMemberIds.includes(characters._id)) {
    return; // Do nothing if characters is already assigned
  }
  emit('characters-selected', characters);
  emit('close');
};

const isAssigned = (memberId: string) => {
  return props.assignedMemberIds.includes(memberId);
};
</script>

<template>
  <CustomModal title="Seleccionar Miembro" @close="$emit('close')">
    <div v-if="characters.length" class="characters-selection-grid">
      <ShadowWarMemberCard v-for="characters in characters" :key="characters._id" :characters="characters" @click="handleCardClick(characters)"
        :class="{ 'is-assigned': isAssigned(characters._id) }" />
    </div>
    <div class="no-characters" v-else>
      <h1><i class="fas fa-ban"></i></h1>
      <h4>
        No hay miembros confirmados
      </h4>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./MemberSelectionModal.scss" />
