<script setup lang="ts">
import { PropType, ref, watch } from 'vue';
import { Match } from '../../../../interfaces';
import CustomModal from '../../Modals/CustomModal.vue';
import ShadowWarMemberCard from '../ShadowWarManagement/ShadowWarMemberCard.vue';

const props = defineProps({
  match: {
    type: Object as PropType<Match | null> | null,
    required: true
  },
});

const emit = defineEmits(['close']);

const editableResult = ref('');

watch(() => props.match, (newMatch) => {
  if (newMatch) editableResult.value = newMatch.result || 'pending';
}, { immediate: true });

</script>

<template>
  <CustomModal :title="`Detalles de Partida`" @close="$emit('close')">
    <div class="match-details-content">
      <div class="result-section">
        <p>Resultado:</p>
        <span :class="['result-chip', `result-${editableResult}`]">
          {{ { pending: 'Pendiente', victory: 'Victoria', defeat: 'Derrota', draw: 'Empate' }[editableResult] ?? editableResult }}
        </span>
      </div>
      <div class="team-composition">
        <div class="team-group">
          <h5>Grupo 1</h5>
          <ul>
            <li v-for="(character, memberIndex) in match?.group1.character" :key="memberIndex">
              <ShadowWarMemberCard :character="character" />
            </li>
          </ul>
        </div>
        <div class="team-group">
          <h5>Grupo 2</h5>
          <ul>
            <li v-for="(character, memberIndex) in match?.group2.character" :key="memberIndex">
              <ShadowWarMemberCard :character="character" />
            </li>
          </ul>
        </div>
      </div>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./MatchDetailsModal.scss" />
