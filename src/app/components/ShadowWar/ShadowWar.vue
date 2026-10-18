<script setup lang="ts">
import { computed, ref } from 'vue';
import ShadowWarMemberCard from './ShadowWarMemberCard.vue';
import { useStore } from '../../../middlewares/store';
import MemberCardSkeleton from '../common/MemberCardSkeleton.vue';
import { useSWKind } from '../../composables/useSWKind';
import { vStuck } from '../../directives/stuck';
import { vStickyBar } from '../../directives/stickyBar';

const store = useStore();
const sw = useSWKind();

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
const shadowWarData = sw.active;
const error = computed(() => store.currentUser.shadowWarError);

const confirmedIds = computed<string[]>(() => {
  const confirmed = shadowWarData.value?.confirmed ?? [];
  return confirmed.map((c: any) => (typeof c === 'string' ? c : c._id));
});

const declinedIds = computed<string[]>(() => {
  const declined = shadowWarData.value?.declined ?? [];
  return declined.map((c: any) => (typeof c === 'string' ? c : c._id));
});

type MemberOrId = { _id: string; currentClass?: string; name?: string; resonance?: number | null; [key: string]: any } | undefined;

const getPaddedMembers = (members: MemberOrId[] | undefined): MemberOrId[] => {
  const padded: MemberOrId[] = members ? [...members] : [];
  const missing = 4 - padded.length;
  return missing > 0 ? padded.concat(Array(missing).fill(undefined)) : padded;
};

const isMemberLinked = (character: MemberOrId) => {
  if (!character?._id || !store.currentCharacter) return false;
  return character._id === store.currentCharacter;
};

const respondingCharId = ref<string | null>(null);

async function handleRespond(action: 'confirm' | 'decline' | 'pending', charId: string) {
  if (!shadowWarData.value?._id || !charId || respondingCharId.value) return;
  respondingCharId.value = charId;
  try {
    await sw.api.respondPublic(shadowWarData.value._id, charId, action);
    await sw.refreshActive();
  } catch { /* silently ignore */ }
  finally { respondingCharId.value = null; }
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
                  <h4 v-sticky-bar>Partida {{ Number(matchIndex) + 1 }}</h4>
                  <div class="match-groups">
                    <div class="group">
                      <h5 v-stuck>Grupo 1</h5>
                      <div class="character-cards-grid">
                        <template v-if="props.loading">
                          <MemberCardSkeleton />
                        </template>
                        <template v-else>
                          <ShadowWarMemberCard v-for="(character, index) in getPaddedMembers(match.group1.character)"
                            :key="index" :character="character" :is-linked="isMemberLinked(character)"
                            :confirmed-ids="confirmedIds"
                            :declined-ids="declinedIds"
                            :can-confirm="isMemberLinked(character)"
                            :confirming="respondingCharId === character?._id"
                            @respond="(action) => handleRespond(action, character!._id)" />
                        </template>
                      </div>
                    </div>
                    <div class="group">
                      <h5 v-stuck>Grupo 2</h5>
                      <div class="character-cards-grid">
                        <template v-if="props.loading">
                          <MemberCardSkeleton />
                        </template>
                        <template v-else>
                          <ShadowWarMemberCard v-for="(character, index) in getPaddedMembers(match.group2.character)"
                            :key="index" :character="character" :is-linked="isMemberLinked(character)"
                            :confirmed-ids="confirmedIds"
                            :declined-ids="declinedIds"
                            :can-confirm="isMemberLinked(character)"
                            :confirming="respondingCharId === character?._id"
                            @respond="(action) => handleRespond(action, character!._id)" />
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