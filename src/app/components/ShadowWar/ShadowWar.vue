<script setup lang="ts">
import { computed, ref } from 'vue';
import ShadowWarMemberCard from './ShadowWarMemberCard.vue';
import { useStore } from '../../../middlewares/store';
import MemberCardSkeleton from '../common/MemberCardSkeleton.vue';
import { confirmShadowWar } from '../../../middlewares/services';

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
const error = computed(() => store.currentUser.shadowWarError);

const confirmedIds = computed<string[]>(() => {
  const confirmed = shadowWarData.value?.confirmed ?? [];
  return confirmed.map((c: any) => (typeof c === 'string' ? c : c._id));
});

type MemberOrId = { _id: string; currentClass?: string; name?: string; resonance?: number; [key: string]: any } | undefined;

const getPaddedMembers = (members: MemberOrId[] | undefined): MemberOrId[] => {
  const padded: MemberOrId[] = members ? [...members] : [];
  const missing = 4 - padded.length;
  return missing > 0 ? padded.concat(Array(missing).fill(undefined)) : padded;
};

const isMemberLinked = (character: MemberOrId) => {
  if (!character?._id || !store.currentCharacter) return false;
  return character._id === store.currentCharacter;
};

const confirming = ref(false);

async function handleConfirm() {
  if (!shadowWarData.value?._id || confirming.value) return;
  confirming.value = true;
  try {
    await confirmShadowWar(shadowWarData.value._id);
    await store.handleGetNextShadowWar();
  } catch { /* silently ignore */ }
  finally  { confirming.value = false; }
}
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
                  <h4>Partida {{ Number(matchIndex) + 1 }}</h4>
                  <div class="match-groups">
                    <div class="group">
                      <h5>Grupo 1</h5>
                      <div class="character-cards-grid">
                        <template v-if="props.loading">
                          <MemberCardSkeleton />
                        </template>
                        <template v-else>
                          <ShadowWarMemberCard v-for="(character, index) in getPaddedMembers(match.group1.character)"
                            :key="index" :character="character" :is-linked="isMemberLinked(character)"
                            :confirmed-ids="confirmedIds"
                            :can-confirm="isMemberLinked(character)"
                            :confirming="confirming"
                            @confirm="handleConfirm" />
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
                            :key="index" :character="character" :is-linked="isMemberLinked(character)"
                            :confirmed-ids="confirmedIds"
                            :can-confirm="isMemberLinked(character)"
                            :confirming="confirming"
                            @confirm="handleConfirm" />
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