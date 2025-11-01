<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useStore } from '../../../middlewares/store';
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


</script>

<template>
  <div class="public-next-battle">
    <div v-if="error">
      <p>Ha ocurrido un error:</p>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./AccursedTower.scss" />