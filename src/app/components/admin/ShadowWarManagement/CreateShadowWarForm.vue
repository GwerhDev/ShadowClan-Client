<script setup lang="ts">
import { ref, onMounted, Ref, computed } from 'vue';
import { updateShadowWarClan, getClans, getClanMembers } from '../../../../middlewares/services';
import { Clan, Character, Match } from '../../../../interfaces';
import ShadowWarMemberCard from './ShadowWarMemberCard.vue';
import MemberSelectionModal from './MemberSelectionModal.vue';
import SearchSelector from '../../Selectors/SearchSelector.vue';
import ShareModal from './ShareModal.vue';
import { useStore } from '../../../../middlewares/store';

const emit = defineEmits(['publish']);
const showShareModal = ref(false);
const store: any = useStore();

const clans: Ref<Clan[]> = ref([]);
const clanMembers: Ref<Character[]> = ref([]);
const shadowWarData = computed(() => store.currentUser.shadowWarData);

const chars  = computed(() => store.currentUser.userData?.character ?? []);
const active = computed(() => (chars.value as any[]).find((c: any) => c._id === store.currentCharacter) ?? chars.value[0] ?? null);
const clanId = computed(() => active.value?.clan?._id ?? active.value?.clan ?? null);

const shadowWarId = ref<string | null>(null);
const enemyClan = ref('');
const loading = ref(true);
const showMemberSelectionModal = ref(false);
const currentSelectionContext = ref<{
  categoryName: keyof typeof battleCategories.value;
  group: 'group1' | 'group2';
  matchIndex: number;
  memberIndex: number;
} | null>(null);

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

const confirmedIds = computed<string[]>(() => {
  const confirmed = shadowWarData.value?.confirmed ?? [];
  return confirmed.map((c: any) => (typeof c === 'string' ? c : c._id));
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

const categoryLabels: Record<string, string> = {
  exalted: 'Sublime',
  eminent: 'Eminente',
  famed: 'Célebre',
  proud: 'Imponente',
};

interface AssignedDetail {
  label: string;
  category: keyof typeof battleCategories.value;
  matchIndex: number;
  group: 'group1' | 'group2';
  memberIndex: number;
}

const assignedMemberDetails = computed(() => {
  const details: Record<string, AssignedDetail> = {};
  for (const [cat, matches] of Object.entries(battleCategories.value)) {
    for (let i = 0; i < (matches as any[]).length; i++) {
      const match = (matches as any[])[i];
      const base = (categoryLabels[cat] ?? cat) + ' · P' + (i + 1);
      match.group1.character.forEach((character: any, memberIndex: number) => {
        if (character?._id) details[character._id] = { label: base + ' · G1', category: cat as any, matchIndex: i, group: 'group1', memberIndex };
      });
      match.group2.character.forEach((character: any, memberIndex: number) => {
        if (character?._id) details[character._id] = { label: base + ' · G2', category: cat as any, matchIndex: i, group: 'group2', memberIndex };
      });
    }
  }
  return details;
});

const handleMemberUnassigned = (characterId: string) => {
  const detail = assignedMemberDetails.value[characterId];
  if (!detail) return;
  const { category, matchIndex, group, memberIndex } = detail;
  battleCategories.value[category][matchIndex][group].character[memberIndex] = undefined;
  updateShadowWarData();
};

onMounted(async () => {
  loading.value = true;
  try {
    if (!shadowWarData.value) {
      await store.handleGetNextShadowWar();
    }

    const [fetchedClans, clanData] = await Promise.all([
      getClans(),
      clanId.value ? getClanMembers(clanId.value) : Promise.resolve(null),
    ]);

    clans.value = fetchedClans;

    if (clanData) {
      clanMembers.value = [
        ...(clanData.leader ? [clanData.leader] : []),
        ...(clanData.officer ?? []),
        ...(clanData.member ?? []),
      ];
    }

    if (shadowWarData.value) {
      shadowWarId.value = shadowWarData.value._id ?? null;

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
    }
  } finally {
    loading.value = false;
  }
});

const toId = (c: any): string | null => {
  if (!c) return null;
  return typeof c === 'string' ? c : (c._id ?? null);
};

const updateShadowWarData = async () => {
  if (!shadowWarId.value) return;

  const battleData: any = {};
  for (const [cat, matches] of Object.entries(battleCategories.value)) {
    battleData[cat] = (matches as any[]).map(match => ({
      result: match.result,
      group1: { character: match.group1.character.map(toId).filter(Boolean) },
      group2: { character: match.group2.character.map(toId).filter(Boolean) },
    }));
  }

  const formData = {
    enemyClan: enemyClan.value || null,
    battle: battleData,
  };
  const updated = await updateShadowWarClan(shadowWarId.value, formData);
  if (updated) store.setShadowWarData(updated);
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

</script>

<template>
  <div class="create-shadow-war-form">
    <div class="clan-selector-container">
      <SearchSelector v-model="enemyClan" :options="clans" label="Clan Enemigo:"
        placeholder="Buscar o seleccionar clan" @select="updateShadowWarData" @clear="updateShadowWarData" />
      <div class="form-actions">
        <button class="btn-share-trigger" @click="showShareModal = true">
          <i class="fab fa-whatsapp"></i>
          Compartir
        </button>
        <button class="btn-publish-trigger" @click="emit('publish')">
          <i class="fas fa-paper-plane"></i>
          Publicar
        </button>
      </div>
    </div>

    <ShareModal v-if="showShareModal" @close="showShareModal = false" />

    <MemberSelectionModal v-if="showMemberSelectionModal" :characters="clanMembers"
      :assigned-member-ids="assignedMemberIds" :confirmed-ids="confirmedIds"
      :assigned-details="assignedMemberDetails"
      @close="showMemberSelectionModal = false"
      @character-selected="handleMemberSelected"
      @character-unassigned="handleMemberUnassigned" />

    <div v-for="(category, categoryName) in battleCategories" :key="categoryName">
      <h2>Batalla {{ translatedCategoryName(categoryName) }}</h2>
      <div v-for="(match, matchIndex) in category" :key="matchIndex">
        <h5>Partida {{ matchIndex + 1 }}</h5>
        <div class="match-groups">
          <div class="group">
            <label><h5>Grupo 1</h5></label>
            <div class="character-cards-grid">
              <template v-if="loading">
                <div v-for="n in 4" :key="n" class="card-skeleton" />
              </template>
              <template v-else>
                <ShadowWarMemberCard v-for="n in 4" :key="n" :character="match.group1.character[n - 1]"
                  :show-unassign-button="!!match.group1.character[n - 1]"
                  :confirmed-ids="confirmedIds"
                  @click="openMemberSelection(categoryName, 'group1', matchIndex, n - 1)"
                  @unassign="unassignMember(categoryName, 'group1', matchIndex, n - 1)" />
              </template>
            </div>
          </div>
          <div class="group">
            <label><h5>Grupo 2</h5></label>
            <div class="character-cards-grid">
              <template v-if="loading">
                <div v-for="n in 4" :key="n" class="card-skeleton" />
              </template>
              <template v-else>
                <ShadowWarMemberCard v-for="n in 4" :key="n" :character="match.group2.character[n - 1]"
                  :show-unassign-button="!!match.group2.character[n - 1]"
                  :confirmed-ids="confirmedIds"
                  @click="openMemberSelection(categoryName, 'group2', matchIndex, n - 1)"
                  @unassign="unassignMember(categoryName, 'group2', matchIndex, n - 1)" />
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./CreateShadowWarForm.scss" />
