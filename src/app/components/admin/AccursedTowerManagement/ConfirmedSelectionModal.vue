<script setup lang="ts">
import { PropType, ref, watch } from 'vue';
import { Character } from '../../../../interfaces';
import ShadowWarMemberCard from './AccursedTowerMemberCard.vue';
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

const handleCardClick = (member: Character) => {
  const index = selectedMembers.value.indexOf(member._id);
  if (index === -1) {
    selectedMembers.value.push(member._id);
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
    <div class="member-grid">
      <div v-for="member in characters" :key="member._id" class="member-card-wrapper"
        :class="{ 'is-selected': isSelected(member._id) }" @click="handleCardClick(member)">
        <ShadowWarMemberCard :member="member" />
        <i v-if="isSelected(member._id)" class="fas fa-check-circle check-icon"></i>
      </div>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./ConfirmedSelectionModal.scss" />