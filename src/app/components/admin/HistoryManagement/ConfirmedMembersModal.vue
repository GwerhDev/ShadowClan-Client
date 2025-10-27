<script setup lang="ts">
import { PropType } from 'vue';
import { Member } from '../../../../interfaces/shadowWar';
import CustomModal from '../../Modals/CustomModal.vue';
import ShadowWarMemberCard from '../ShadowWarManagement/ShadowWarMemberCard.vue';

defineProps({
  members: {
    type: Array as PropType<Member[]> | undefined,
    required: true
  }
});

const emit = defineEmits(['close']);
</script>

<template>
  <CustomModal title="Miembros Confirmados" @close="$emit('close')">
    <div v-if="members.length" class="member-selection-grid">
      <ShadowWarMemberCard v-for="member in members" :key="member._id" :member="member" />
    </div>
    <div class="no-member" v-else>
      <h1><i class="fas fa-ban"></i></h1>
      <h4>
        No hay miembros confirmados
      </h4>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss">
.member-selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.no-member {
  text-align: center;
  padding: 2rem;
  color: #888;

  h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
}
</style>