<script setup lang="ts">
import { PropType, ref, computed } from 'vue';
import { Character } from '../../../../interfaces';
import AccursedTowerMemberCard from './AccursedTowerMemberCard.vue';
import CustomModal from '../../Modals/CustomModal.vue';

const props = defineProps({
  characters: {
    type: Array as PropType<Character[]>,
    required: true,
  },
  assignedMemberIds: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'character-selected']);

const search = ref('');

const filteredCharacters = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return props.characters;
  return props.characters.filter(c => c.name?.toLowerCase().includes(q));
});

const isAssigned = (id: string) => props.assignedMemberIds.includes(id);

const handleCardClick = (character: Character) => {
  if (isAssigned(character._id)) return;
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

    <div v-if="filteredCharacters.length" class="member-selection-grid">
      <AccursedTowerMemberCard
        v-for="character in filteredCharacters"
        :key="character._id"
        :character="character"
        :class="{ 'is-assigned': isAssigned(character._id) }"
        @click="handleCardClick(character)"
      />
    </div>

    <div class="no-member" v-else>
      <i class="fas fa-ban"></i>
      <span>Sin resultados</span>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./MemberSelectionModal.scss" />
