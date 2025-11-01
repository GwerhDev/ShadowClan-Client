<script setup lang="ts">
import { ref, onMounted, Ref, computed } from 'vue';
import { updateShadowWar, getClans, getAdminCharacters } from '../../../../middlewares/services';
import { Clan, Character, Match } from '../../../../interfaces';
import ShadowWarMemberCard from './ShadowWarMemberCard.vue';
import MemberSelectionModal from './MemberSelectionModal.vue';
import SearchSelector from '../../Selectors/SearchSelector.vue';
import ConfirmedSelectionModal from './ConfirmedSelectionModal.vue';
import { useStore } from '../../../../middlewares/store';

const store: any = useStore();

const clans: Ref<Clan[]> = ref([]);
const characters: Ref<Character[]> = ref([]);
const shadowWarData = computed(() => store.currentUser.shadowWarData);
const enemyClan = ref('');
const showMemberSelectionModal = ref(false);
const currentSelectionContext = ref<{
  categoryName: keyof typeof battleCategories.value;
  group: 'group1' | 'group2';
  matchIndex: number;
  memberIndex: number;
} | null>(null);

const confirmedCharacters: Ref<Character[]> = ref([]);
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
  exalted: Array(3).fill(null).map(() => ({ group1: { character: Array(4).fill(undefined) }, group2: { character: Array(4).fill(undefined) }, result: 'pending' })),
  eminent: Array(3).fill(null).map(() => ({ group1: { character: Array(4).fill(undefined) }, group2: { character: Array(4).fill(undefined) }, result: 'pending' })),
  famed: Array(3).fill(null).map(() => ({ group1: { character: Array(4).fill(undefined) }, group2: { character: Array(4).fill(undefined) }, result: 'pending' })),
  proud: Array(3).fill(null).map(() => ({ group1: { character: Array(4).fill(undefined) }, group2: { character: Array(4).fill(undefined) }, result: 'pending' })),
});

const translatedCategoryName = computed(() => (categoryName: string) => {
  return battleCategoryTranslations[categoryName] || categoryName;
});

const assignedMemberIds = computed(() => {
  const ids = new Set<string>();
  for (const category of Object.values(battleCategories.value)) {
    for (const match of category) {
      for (const character of match.group1.character) {
        if (character?._id) ids.add(character._id);
      }
      for (const character of match.group2.character) {
        if (character?._id) ids.add(character._id);
      }
    }
  }
  return Array.from(ids);
});

const confirmedMemberIds = computed(() => {
  return confirmedCharacters.value.map(character => character._id);
});

onMounted(async () => {
  const fetchedClans = await getClans();
  clans.value = fetchedClans;
  const fetchedMembers = await getAdminCharacters();
  characters.value = fetchedMembers;

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
      confirmedCharacters.value = shadowWarData.value.confirmed;
    }
  }
});

const updateShadowWarData = async () => {
  const battleData = JSON.parse(JSON.stringify(battleCategories.value));
  const formData = {
    enemyClan: enemyClan.value,
    battle: battleData,
    confirmed: confirmedCharacters.value.filter(character => character && character._id).map(character => character._id), // Include confirmed characters
  };
  await updateShadowWar(store.currentUser.shadowWarData._id, formData);
};

const openMemberSelection = (categoryName: keyof typeof battleCategories.value, group: 'group1' | 'group2', matchIndex: number, memberIndex: number) => {
  currentSelectionContext.value = { categoryName, group, matchIndex, memberIndex };
  showMemberSelectionModal.value = true;
};

const handleMemberSelected = (selectedMember: Character) => {
  if (currentSelectionContext.value) {
    const { categoryName, group, matchIndex, memberIndex } = currentSelectionContext.value;
    battleCategories.value[categoryName][matchIndex][group].character[memberIndex] = selectedMember;
    updateShadowWarData();
  }
  showMemberSelectionModal.value = false;
};

const unassignMember = (categoryName: keyof typeof battleCategories.value, group: 'group1' | 'group2', matchIndex: number, memberIndex: number) => {
  battleCategories.value[categoryName][matchIndex][group].character[memberIndex] = undefined;
  updateShadowWarData();
};

const openConfirmedMembersSelection = () => {
  showConfirmedMemberSelectionModal.value = true;
};

const handleConfirmedMembersUpdate = (selectedMemberIds: string[]) => {
  const oldConfirmedMemberIds = new Set(confirmedCharacters.value.map(character => character._id));
  confirmedCharacters.value = characters.value.filter(character => character && selectedMemberIds.includes(character._id));
  const newConfirmedMemberIds = new Set(confirmedCharacters.value.map(character => character._id));
  const removedMemberIds = [...oldConfirmedMemberIds].filter(id => !newConfirmedMemberIds.has(id));

  // Unassign removed characters from battle groups
  if (removedMemberIds.length > 0) {
    for (const categoryName in battleCategories.value) {
      // Ensure categoryName is a valid key
      if (Object.prototype.hasOwnProperty.call(battleCategories.value, categoryName)) {
        const category = battleCategories.value[categoryName as keyof typeof battleCategories.value];
        for (let matchIndex = 0; matchIndex < category.length; matchIndex++) {
          const match = category[matchIndex];

          // Check group1
          for (let memberIndex = 0; memberIndex < match.group1.character.length; memberIndex++) {
            const character = match.group1.character[memberIndex];
            if (character && removedMemberIds.includes(character._id)) {
              match.group1.character[memberIndex] = undefined;
            }
          }

          // Check group2
          for (let memberIndex = 0; memberIndex < match.group2.character.length; memberIndex++) {
            const character = match.group2.character[memberIndex];
            if (character && removedMemberIds.includes(character._id)) {
              match.group2.character[memberIndex] = undefined;
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
          placeholder="Buscar o seleccionar clan" @select="updateShadowWarData" @clear="updateShadowWarData" />
        <div class="action-buttons">
          <button type="button" @click="openConfirmedMembersSelection">
            <i class="fas fa-users"></i>Nómina de Confirmados
          </button>
        </div>
      </div>
    </div>

    <MemberSelectionModal v-if="showMemberSelectionModal" :characters="confirmedCharacters"
      :assigned-character-ids="assignedMemberIds" @close="showMemberSelectionModal = false"
      @character-selected="handleMemberSelected" />
    <ConfirmedSelectionModal v-if="showConfirmedMemberSelectionModal" :characters="characters"
      :initial-selected-character-ids="confirmedMemberIds" @close="showConfirmedMemberSelectionModal = false"
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
            <div class="character-cards-grid">
              <ShadowWarMemberCard v-for="n in 4" :key="n" :character="match.group1.character[n - 1]"
                :show-unassign-button="!!match.group1.character[n - 1]"
                @click="openMemberSelection(categoryName, 'group1', matchIndex, n - 1)"
                @unassign="unassignMember(categoryName, 'group1', matchIndex, n - 1)" />
            </div>
          </div>
          <div class="group">
            <label>
              <h5>Grupo 2</h5>
            </label>
            <div class="character-cards-grid">
              <ShadowWarMemberCard v-for="n in 4" :key="n" :character="match.group2.character[n - 1]"
                :show-unassign-button="!!match.group2.character[n - 1]"
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