<script setup lang="ts">
import { PropType, ref, computed } from 'vue';
import { Character } from '../../../../interfaces';
import ShadowWarMemberCard from './ShadowWarMemberCard.vue';
import CustomModal from '../../Modals/CustomModal.vue';

interface AssignedDetail {
  label: string;
  category: string;
  matchIndex: number;
  group: string;
  memberIndex: number;
}

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
  },
  assignedDetails: {
    type: Object as PropType<Record<string, AssignedDetail>>,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'character-selected', 'character-unassigned']);

const search = ref('');

const filteredCharacters = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return props.characters;
  return props.characters.filter(c => c.name.toLowerCase().includes(q));
});

const isAssigned = (memberId: string) => props.assignedMemberIds.includes(memberId);

const handleCardClick = (character: Character) => {
  if (isAssigned(character._id)) {
    emit('character-unassigned', character._id);
    return;
  }
  emit('character-selected', character);
  emit('close');
};
</script>

<template>
  <CustomModal title="Seleccionar Miembro" @close="$emit('close')">

    <div class="member-search-bar">
      <i class="fas fa-search"></i>
      <input v-model="search" type="text" placeholder="Buscar miembro..." />
    </div>

    <div v-if="filteredCharacters.length" class="characters-selection-grid">
      <div v-for="character in filteredCharacters" :key="character._id" class="member-grid-item">
        <ShadowWarMemberCard
          :character="character"
          :confirmed-ids="confirmedIds"
          :assigned-ids="assignedMemberIds"
          :class="{ 'is-assigned': isAssigned(character._id) }"
          @click="handleCardClick(character)"
        />
        <span v-if="assignedDetails[character._id]" class="group-tag">
          <i class="fas fa-layer-group"></i>
          {{ assignedDetails[character._id].label }}
        </span>
      </div>
    </div>

    <div class="no-characters" v-else>
      <i class="fas fa-ban"></i>
      <span>Sin resultados</span>
    </div>

  </CustomModal>
</template>

<style scoped lang="scss" src="./MemberSelectionModal.scss" />
