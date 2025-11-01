<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import ShadowWarMemberCard from './ShadowWarMemberCard.vue';
import { useStore } from '../../../middlewares/store';
import MemberCardSkeleton from '../common/MemberCardSkeleton.vue';
import { Character } from '../../../interfaces';

const store: any = useStore();

const props = defineProps({
  activeTab: {
    type: Object as () => { value: string; label: string },
    required: true
  },
  loading: {
    type: Boolean,
    required: true
  }
});

const activeCategory = computed(() => props.activeTab.value);
const shadowWarData = computed(() => store.currentUser.shadowWarData);
const loggedInUser = computed(() => store.currentUser.userData);
const error = computed(() => store.currentUser.shadowWarError);

watchEffect(() => {
  if (shadowWarData.value && shadowWarData.value.battle && loggedInUser.value && loggedInUser.value.character) {
    const battlesSet = new Set<string>();
    for (const categoryName in shadowWarData.value.battle) {
      const category = shadowWarData.value.battle[categoryName];
      for (let matchIndex = 0; matchIndex < category.length; matchIndex++) {
        const match = category[matchIndex];

        const group1Members = match.group1.character || [];
        if (Array.isArray(loggedInUser.value.character) && group1Members.some((m: Character) => m && loggedInUser.value.character.includes(m._id))) {
          battlesSet.add(JSON.stringify({ category: categoryName, match: matchIndex + 1, group: 1 }));
        }

        const group2Members = match.group2.character || [];
        if (Array.isArray(loggedInUser.value.character) && group2Members.some((m: Character) => m && loggedInUser.value.character.includes(m._id))) {
          battlesSet.add(JSON.stringify({ category: categoryName, match: matchIndex + 1, group: 2 }));
        }
      }
    }
    const uniqueBattles = Array.from(battlesSet).map(s => JSON.parse(s));

    store.setUserBattleInfo(uniqueBattles);
  } else {
    store.clearUserBattleInfo();
  }
});

const getPaddedMembers = (members: Character[] | undefined) => {
  const padded: (Character | undefined)[] = members ? [...members] : [];
  const missingMembers = 4 - padded.length;
  if (missingMembers > 0) {
    return padded.concat(Array(missingMembers).fill(undefined));
  }
  return padded;
};

const isMemberLinked = (character: Character | undefined) => {
  if (!loggedInUser.value || !loggedInUser.value.character || !character) {
    return false;
  }
  return loggedInUser.value.character.includes(character._id);
};
</script>

<template>
  <div class="public-next-battle">
    <div v-if="error">
      <p>Ha ocurrido un error:</p>
      <pre>{{ error }}</pre>
    </div>

    <div v-if="shadowWarData && shadowWarData.battle" class="main-content-wrapper">
      <div class="content-section">
        <div v-for="(category, categoryName) in shadowWarData.battle" :key="categoryName">
          <div v-if="activeCategory === String(categoryName)" class="category">
            <h3>Batalla {{ props.activeTab.label }}</h3>
            <div v-if="category.length === 0">
              <p>No hay partidas asignadas para esta categoría.</p>
            </div>
            <div v-else>
              <div class="matches-row-container">
                <div v-for="(match, matchIndex) in category" :key="matchIndex" class="match">
                  <h4>Partida {{ matchIndex + 1 }}</h4>
                  <div class="match-groups">
                    <div class="group">
                      <h5>Grupo 1</h5>
                      <div class="character-cards-grid">
                        <template v-if="props.loading">
                          <MemberCardSkeleton />
                        </template>
                        <template v-else>
                          <ShadowWarMemberCard v-for="(character, index) in getPaddedMembers(match.group1.character)"
                            :key="index" :character="character" :is-linked="isMemberLinked(character)" />
                        </template>
                      </div>
                    </div>
                    <div class="group">
                      <h5>Grupo 2</h5>
                      <div class="character-cards-grid">
                        <template v-if="props.loading">
                          <MemberCardSkeleton />
                        </template>
                        <template v-else>
                          <ShadowWarMemberCard v-for="(character, index) in getPaddedMembers(match.group2.character)"
                            :key="index" :character="character" :is-linked="isMemberLinked(character)" />
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./ShadowWar.scss" />