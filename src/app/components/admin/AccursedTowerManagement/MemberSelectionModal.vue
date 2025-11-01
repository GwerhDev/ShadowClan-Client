<script setup lang="ts">
import { PropType } from 'vue';
import { Character } from '../../../../interfaces';
import ShadowWarMemberCard from './AccursedTowerMemberCard.vue';
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

const emit = defineEmits(['close', 'member-selected']);

const handleCardClick = (member: Character) => {
  if (props.assignedMemberIds.includes(member._id)) {
    return; // Do nothing if member is already assigned
  }
  emit('member-selected', member);
  emit('close');
};

const isAssigned = (memberId: string) => {
  return props.assignedMemberIds.includes(memberId);
};
</script>

<template>
  <CustomModal title="Seleccionar Miembro" @close="$emit('close')">
    <div v-if="characters.length" class="member-selection-grid">
      <ShadowWarMemberCard v-for="member in characters" :key="member._id" :member="member" @click="handleCardClick(member)"
        :class="{ 'is-assigned': isAssigned(member._id) }" />
    </div>
    <div class="no-member" v-else>
      <h1><i class="fas fa-ban"></i></h1>
      <h4>
        No hay miembros confirmados
      </h4>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./MemberSelectionModal.scss" />
