<script setup lang="ts">
import { computed, PropType, ref, watch } from 'vue';
import { Match, Member } from '../../../../interfaces/shadowWar';
import CustomModal from '../../Modals/CustomModal.vue';
import { useStore } from '../../../../middlewares/store';
import ShadowWarMemberCard from '../ShadowWarManagement/ShadowWarMemberCard.vue';

const props = defineProps({
  match: {
    type: Object as PropType<Match | null> | null,
    required: true
  },
});

const emit = defineEmits(['close']);

const store = useStore();
const currentShadowWar = computed(() => store.admin.currentShadowWar);

const editableResult = ref('');

watch(() => props.match, (newMatch) => {
  if (newMatch) {
    editableResult.value = newMatch.result || 'pending';
  }
}, { immediate: true });

const compareMemberGroups = (groupA: (Member | undefined)[] | undefined, groupB: (Member | undefined)[] | undefined) => {
  if (!groupA || !groupB) return false;
  if (groupA.length !== groupB.length) return false;

  const idsA = groupA.map(member => member?._id).filter(Boolean).sort();
  const idsB = groupB.map(member => member?._id).filter(Boolean).sort();

  if (idsA.length !== idsB.length) return false;

  for (let i = 0; i < idsA.length; i++) {
    if (idsA[i] !== idsB[i]) return false;
  }
  return true;
};

const updateResult = async () => {
  if (!store.admin.shadowWars || !props.match || !currentShadowWar.value || !currentShadowWar.value.battle) {
    console.error('currentShadowWar or its battle property is undefined.');
    return;
  }

  const updatedShadowWar = JSON.parse(JSON.stringify(currentShadowWar.value));

  const battleTypes = ['exalted', 'eminent', 'famed', 'proud'] as const;
  let matchFound = false;
  for (const type of battleTypes) {
    const matchIndex = updatedShadowWar.battle[type].findIndex((m: Match) =>
      compareMemberGroups(m.group1.member, props.match?.group1.member) &&
      compareMemberGroups(m.group2.member, props.match?.group2.member)
    );
    if (matchIndex !== -1) {
      updatedShadowWar.battle[type][matchIndex].result = editableResult.value;
      matchFound = true;
      break;
    }
  }

  if (!matchFound) {
    console.error('Match not found in shadow war for update.');
    return;
  }

  try {
    await store.handleUpdateShadowWar(updatedShadowWar._id!, updatedShadowWar);
  } catch (error) {
    console.error('Error updating shadow war result:', error);
  }
};
</script>

<template>
  <CustomModal :title="`Detalles de Partida`" @close="$emit('close')">
    <div class="match-details-content">
      <div class="result-section">
        <p>Resultado:</p>
        <select v-model="editableResult" @change="updateResult">
          <option value="pending">Pendiente</option>
          <option value="victory">Victoria</option>
          <option value="defeat">Derrota</option>
          <option value="draw">Empate</option>
        </select>
      </div>
      <div class="team-composition">
        <div class="team-group">
          <h5>Grupo 1</h5>
          <ul>
            <li v-for="(member, memberIndex) in match?.group1.member" :key="memberIndex">
              <ShadowWarMemberCard :member="member" />
            </li>
          </ul>
        </div>
        <div class="team-group">
          <h5>Grupo 2</h5>
          <ul>
            <li v-for="(member, memberIndex) in match?.group2.member" :key="memberIndex">
              <ShadowWarMemberCard :member="member" />
            </li>
          </ul>
        </div>
      </div>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./MatchDetailsModal.scss" />
