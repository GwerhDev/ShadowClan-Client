<script setup lang="ts">
import { PropType, ref, watch } from 'vue';
import { Character } from '../../../../interfaces';
import ShadowWarMemberCard from './ShadowWarMemberCard.vue';
import CustomModal from '../../Modals/CustomModal.vue';

const props = defineProps({
  characters: {
    type: Array as PropType<Character[]>,
    required: true
  },
  initialSelectedMemberIds: {
    type: Array as PropType<string[]>,
    default: () => []
  }
});

const emit = defineEmits(['close', 'update-selection']);

const selectedMembers = ref<string[]>([]);

watch(() => props.initialSelectedMemberIds, (newVal) => {
  selectedMembers.value = [...newVal];
}, { immediate: true });

const handleCardClick = (character: Character) => {
  const index = selectedMembers.value.indexOf(character._id);
  if (index === -1) {
    selectedMembers.value.push(character._id);
  } else {
    selectedMembers.value.splice(index, 1);
  }
  emit('update-selection', selectedMembers.value);
};

const isSelected = (memberId: string) => {
  return selectedMembers.value.includes(memberId);
};
</script>

<template>
  <CustomModal title="Seleccionar Miembros Confirmados" @close="$emit('close')">
    <div class="character-grid">
      <div v-for="character in characters" :key="character._id" class="character-card-wrapper"
        :class="{ 'is-selected': isSelected(character._id) }" @click="handleCardClick(character)">
        <ShadowWarMemberCard :character="character" />
        <i v-if="isSelected(character._id)" class="fas fa-check-circle check-icon"></i>
      </div>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./ConfirmedSelectionModal.scss" />