<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import * as ShadowWarInterfaces from '../../../interfaces';
import { useStore } from '../../../middlewares/store';

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