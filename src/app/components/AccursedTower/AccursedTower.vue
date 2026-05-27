<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from '../../../middlewares/store';
import ShadowWarMemberCard from '../ShadowWar/ShadowWarMemberCard.vue';
import EmptyState from '../common/EmptyState.vue';

const store: any = useStore();
const route      = useRoute();

const towerWarList = computed(() => store.currentUser.towerWarList as any[]);
const error        = computed(() => store.currentUser.towerWarError);

// Resolve the tower matching the current route param
const towerWar = computed(() => {
  const id = route.params.accursedtower_id as string;
  return towerWarList.value.find((tw: any) => tw._id === id) ?? null;
});

const groupSizes = { group1: 4, group2: 4, group3: 2 } as const;

function padGroup(arr: any[] | undefined, size: number): (any | undefined)[] {
  const result = [...(arr ?? [])];
  while (result.length < size) result.push(undefined);
  return result;
}

const isMemberLinked = (character: any) => {
  if (!character?._id || !store.currentCharacter) return false;
  return character._id === store.currentCharacter;
};
</script>

<template>
  <div class="public-next-battle">

    <EmptyState v-if="error" icon="fas fa-exclamation-triangle" :message="error" />

    <EmptyState
      v-else-if="!towerWar"
      icon="fas fa-chess-rook"
      message="No hay un enfrentamiento de Torre Maldita programado."
    />

    <div v-else class="main-content-wrapper">
      <div class="content-section">

        <!-- Grupos 1 y 2 lado a lado -->
        <div class="match-groups">
          <div v-for="grp in (['group1', 'group2'] as const)" :key="grp" class="group">
            <h5>{{ grp === 'group1' ? 'Grupo 1' : 'Grupo 2' }}</h5>
            <div class="character-cards-grid">
              <ShadowWarMemberCard
                v-for="(character, idx) in padGroup(towerWar.roster?.[grp], groupSizes[grp])"
                :key="idx"
                :character="character"
                :is-linked="isMemberLinked(character)"
                :confirmed-ids="[]"
              />
            </div>
          </div>
        </div>

        <!-- Grupo 3 -->
        <div class="group3-section">
          <h5>Grupo 3</h5>
          <div class="character-cards-grid character-cards-grid--2">
            <ShadowWarMemberCard
              v-for="(character, idx) in padGroup(towerWar.roster?.group3, groupSizes.group3)"
              :key="idx"
              :character="character"
              :is-linked="isMemberLinked(character)"
              :confirmed-ids="[]"
            />
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped lang="scss" src="./AccursedTower.scss" />
