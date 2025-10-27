<script setup lang="ts">
import { ref, onMounted, Ref, computed } from 'vue';
import { updateShadowWar, getClans, getMembers } from '../../../../middlewares/services';
import { Clan, Member, Match } from '../../../../interfaces/shadowWar';
import ShadowWarMemberCard from './ShadowWarMemberCard.vue';
import MemberSelectionModal from './MemberSelectionModal.vue';
import SearchSelector from '../../Selectors/SearchSelector.vue';
import ConfirmedSelectionModal from './ConfirmedSelectionModal.vue';
import { useStore } from '../../../../middlewares/store';

const store: any = useStore();

const clans: Ref<Clan[]> = ref([]);
const members: Ref<Member[]> = ref([]);
const shadowWarData = computed(() => store.currentUser.shadowWarData);
const enemyClan = ref('');
const showMemberSelectionModal = ref(false);
const currentSelectionContext = ref<{
  categoryName: keyof typeof battleCategories.value;
  group: 'group1' | 'group2';
  matchIndex: number;
  memberIndex: number;
} | null>(null);

const confirmedMembers: Ref<Member[]> = ref([]);
const showConfirmedMemberSelectionModal = ref(false);

const battleCategoryTranslations: Record<string, string> = {
  exalted: 'sublime',
  eminent: 'eminente',
  famed: 'célebre',
  proud: 'imponente',
};

const battleCategories = ref<{
  exalted: Match[];
  eminent: Match[];
  famed: Match[];
  proud: Match[];
}>({
  exalted: Array(3).fill(null).map(() => ({ group1: { member: Array(4).fill(undefined) }, group2: { member: Array(4).fill(undefined) }, result: 'pending' })),
  eminent: Array(3).fill(null).map(() => ({ group1: { member: Array(4).fill(undefined) }, group2: { member: Array(4).fill(undefined) }, result: 'pending' })),
  famed: Array(3).fill(null).map(() => ({ group1: { member: Array(4).fill(undefined) }, group2: { member: Array(4).fill(undefined) }, result: 'pending' })),
  proud: Array(3).fill(null).map(() => ({ group1: { member: Array(4).fill(undefined) }, group2: { member: Array(4).fill(undefined) }, result: 'pending' })),
});

const translatedCategoryName = computed(() => (categoryName: string) => {
  return battleCategoryTranslations[categoryName] || categoryName;
});

const assignedMemberIds = computed(() => {
  const ids = new Set<string>();
  for (const category of Object.values(battleCategories.value)) {
    for (const match of category) {
      for (const member of match.group1.member) {
        if (member?._id) ids.add(member._id);
      }
      for (const member of match.group2.member) {
        if (member?._id) ids.add(member._id);
      }
    }
  }
  return Array.from(ids);
});

const confirmedMemberIds = computed(() => {
  return confirmedMembers.value.map(member => member._id);
});

onMounted(async () => {
  clans.value = await getClans();
  const fetchedMembers = await getMembers();
  members.value = fetchedMembers;

  if (shadowWarData.value) {
    if (shadowWarData.value.battle) {
      const { exalted, eminent, famed, proud } = shadowWarData.value.battle;
      battleCategories.value.exalted = exalted || battleCategories.value.exalted;
      battleCategories.value.eminent = eminent || battleCategories.value.eminent;
      battleCategories.value.famed = famed || battleCategories.value.famed;
      battleCategories.value.proud = proud || battleCategories.value.proud;
    }

    if (shadowWarData.value.enemyClan) {
      enemyClan.value = shadowWarData.value.enemyClan._id;
    }
    if (shadowWarData.value.confirmed) {
      confirmedMembers.value = shadowWarData.value.confirmed;
    }
  }
});

const updateShadowWarData = async () => {
  const battleData = JSON.parse(JSON.stringify(battleCategories.value));
  const formData = {
    enemyClan: enemyClan.value,
    battle: battleData,
    confirmed: confirmedMembers.value.filter(member => member && member._id).map(member => member._id), // Include confirmed members
  };
  await updateShadowWar(store.currentUser.shadowWarData._id, formData);
};

const openMemberSelection = (categoryName: keyof typeof battleCategories.value, group: 'group1' | 'group2', matchIndex: number, memberIndex: number) => {
  currentSelectionContext.value = { categoryName, group, matchIndex, memberIndex };
  showMemberSelectionModal.value = true;
};

const handleMemberSelected = (selectedMember: Member) => {
  if (currentSelectionContext.value) {
    const { categoryName, group, matchIndex, memberIndex } = currentSelectionContext.value;
    battleCategories.value[categoryName][matchIndex][group].member[memberIndex] = selectedMember;
    updateShadowWarData();
  }
  showMemberSelectionModal.value = false;
};

const unassignMember = (categoryName: keyof typeof battleCategories.value, group: 'group1' | 'group2', matchIndex: number, memberIndex: number) => {
  battleCategories.value[categoryName][matchIndex][group].member[memberIndex] = undefined;
  updateShadowWarData();
};

const openConfirmedMembersSelection = () => {
  showConfirmedMemberSelectionModal.value = true;
};

const handleConfirmedMembersUpdate = (selectedMemberIds: string[]) => {
  const oldConfirmedMemberIds = new Set(confirmedMembers.value.map(member => member._id));
  confirmedMembers.value = members.value.filter(member => member && selectedMemberIds.includes(member._id));
  const newConfirmedMemberIds = new Set(confirmedMembers.value.map(member => member._id));
  const removedMemberIds = [...oldConfirmedMemberIds].filter(id => !newConfirmedMemberIds.has(id));

  // Unassign removed members from battle groups
  if (removedMemberIds.length > 0) {
    for (const categoryName in battleCategories.value) {
      // Ensure categoryName is a valid key
      if (Object.prototype.hasOwnProperty.call(battleCategories.value, categoryName)) {
        const category = battleCategories.value[categoryName as keyof typeof battleCategories.value];
        for (let matchIndex = 0; matchIndex < category.length; matchIndex++) {
          const match = category[matchIndex];

          // Check group1
          for (let memberIndex = 0; memberIndex < match.group1.member.length; memberIndex++) {
            const member = match.group1.member[memberIndex];
            if (member && removedMemberIds.includes(member._id)) {
              match.group1.member[memberIndex] = undefined;
            }
          }

          // Check group2
          for (let memberIndex = 0; memberIndex < match.group2.member.length; memberIndex++) {
            const member = match.group2.member[memberIndex];
            if (member && removedMemberIds.includes(member._id)) {
              match.group2.member[memberIndex] = undefined;
            }
          }
        }
      }
    }
  }

  updateShadowWarData();
};

</script>

<template>
  <div class="create-shadow-war-form">
    <div class="clan-selector-container">
      <div class="clan-selection-area">
        <SearchSelector v-model="enemyClan" :options="clans" label="Clan Enemigo:"
          placeholder="Buscar o seleccionar clan" @select="updateShadowWarData" />
        <div class="action-buttons">
          <button type="button" @click="openConfirmedMembersSelection">
            <i class="fas fa-users"></i>Nómina de Confirmados
          </button>
        </div>
      </div>
    </div>

    <MemberSelectionModal v-if="showMemberSelectionModal" :members="confirmedMembers"
      :assigned-member-ids="assignedMemberIds" @close="showMemberSelectionModal = false"
      @member-selected="handleMemberSelected" />
    <ConfirmedSelectionModal v-if="showConfirmedMemberSelectionModal" :members="members"
      :initial-selected-member-ids="confirmedMemberIds" @close="showConfirmedMemberSelectionModal = false"
      @update-selection="handleConfirmedMembersUpdate" />
    <div v-for="(category, categoryName) in battleCategories" :key="categoryName">
      <h2>Batalla {{ translatedCategoryName(categoryName) }}</h2>
      <div v-for="(match, matchIndex) in category" :key="matchIndex">
        <h5>Partida {{ matchIndex + 1 }}</h5>
        <div class="match-groups">
          <div class="group">
            <label>
              <h5>Grupo 1</h5>
            </label>
            <div class="member-cards-grid">
              <ShadowWarMemberCard v-for="n in 4" :key="n" :member="match.group1.member[n - 1]"
                :show-unassign-button="!!match.group1.member[n - 1]"
                @click="openMemberSelection(categoryName, 'group1', matchIndex, n - 1)"
                @unassign="unassignMember(categoryName, 'group1', matchIndex, n - 1)" />
            </div>
          </div>
          <div class="group">
            <label>
              <h5>Grupo 2</h5>
            </label>
            <div class="member-cards-grid">
              <ShadowWarMemberCard v-for="n in 4" :key="n" :member="match.group2.member[n - 1]"
                :show-unassign-button="!!match.group2.member[n - 1]"
                @click="openMemberSelection(categoryName, 'group2', matchIndex, n - 1)"
                @unassign="unassignMember(categoryName, 'group2', matchIndex, n - 1)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./CreateShadowWarForm.scss" />