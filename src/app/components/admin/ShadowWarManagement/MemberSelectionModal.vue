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
  },
  confirmedIds: {
    type: Array as PropType<string[]>,
    default: () => []
  }
});

const emit = defineEmits(['close', 'character-selected']);

const handleCardClick = (character: Character) => {
  if (props.assignedMemberIds.includes(character._id)) {
    return;
  }
  emit('character-selected', character);
  emit('close');
};

const isAssigned = (memberId: string) => props.assignedMemberIds.includes(memberId);
</script>

<template>
  <CustomModal title="Seleccionar Miembro" @close="$emit('close')">
    <div v-if="characters.length" class="characters-selection-grid">
      <ShadowWarMemberCard v-for="character in characters" :key="character._id" :character="character"
        :confirmed-ids="confirmedIds" :assigned-ids="assignedMemberIds"
        @click="handleCardClick(character)" :class="{ 'is-assigned': isAssigned(character._id) }" />
    </div>
    <div class="no-characters" v-else>
      <h1><i class="fas fa-ban"></i></h1>
      <h4>No hay miembros en el clan</h4>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./MemberSelectionModal.scss" />
