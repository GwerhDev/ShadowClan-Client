<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import * as ShadowWarInterfaces from '../../../interfaces/shadowWar';
import PublicShadowWarMemberCard from './PublicShadowWarMemberCard.vue';
import { useStore } from '../../../middlewares/store';
import MemberCardSkeleton from '../common/MemberCardSkeleton.vue';

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
  if (shadowWarData.value && shadowWarData.value.battle && loggedInUser.value && loggedInUser.value.member) {
    const battlesSet = new Set<string>();
    for (const categoryName in shadowWarData.value.battle) {
      const category = shadowWarData.value.battle[categoryName];
      for (let matchIndex = 0; matchIndex < category.length; matchIndex++) {
        const match = category[matchIndex];

        const group1Members = match.group1.member || [];
        if (Array.isArray(loggedInUser.value.member) && group1Members.some((m: ShadowWarInterfaces.Member) => m && loggedInUser.value.member.includes(m._id))) {
          battlesSet.add(JSON.stringify({ category: categoryName, match: matchIndex + 1, group: 1 }));
        }

        const group2Members = match.group2.member || [];
        if (Array.isArray(loggedInUser.value.member) && group2Members.some((m: ShadowWarInterfaces.Member) => m && loggedInUser.value.member.includes(m._id))) {
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

const getPaddedMembers = (members: ShadowWarInterfaces.Member[] | undefined) => {
  const padded: (ShadowWarInterfaces.Member | undefined)[] = members ? [...members] : [];
  const missingMembers = 4 - padded.length;
  if (missingMembers > 0) {
    return padded.concat(Array(missingMembers).fill(undefined));
  }
  return padded;
};

const isMemberLinked = (member: ShadowWarInterfaces.Member | undefined) => {
  if (!loggedInUser.value || !loggedInUser.value.member || !member) {
    return false;
  }
  return loggedInUser.value.member.includes(member._id);
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
                      <div class="member-cards-grid">
                        <template v-if="props.loading">
                          <MemberCardSkeleton />
                        </template>
                        <template v-else>
                          <PublicShadowWarMemberCard v-for="(member, index) in getPaddedMembers(match.group1.member)"
                            :key="index" :member="member" :is-linked="isMemberLinked(member)" />
                        </template>
                      </div>
                    </div>
                    <div class="group">
                      <h5>Grupo 2</h5>
                      <div class="member-cards-grid">
                        <template v-if="props.loading">
                          <MemberCardSkeleton />
                        </template>
                        <template v-else>
                          <PublicShadowWarMemberCard v-for="(member, index) in getPaddedMembers(match.group2.member)"
                            :key="index" :member="member" :is-linked="isMemberLinked(member)" />
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

<style scoped lang="scss" src="./PublicShadowWar.scss" />