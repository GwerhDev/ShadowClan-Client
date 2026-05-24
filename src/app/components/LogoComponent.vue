<style scoped lang="scss" src="./LogoComponent.scss"/>
<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../../middlewares/store';

const store: any = useStore();

const clanLabel = computed(() => {
  const chars = store.currentUser.userData?.character ?? [];
  const active = chars.find((c: any) => c._id === store.currentCharacter) ?? chars[0] ?? null;
  return active?.clan?.name ?? 'Caminante';
});
</script>

<template>
  <div class="logo-container">
    <router-link to='/'>
      <span class="logo-styles">ShadowclaN</span>
      <span class="logo-clan">{{ clanLabel }}</span>
    </router-link>
  </div>
</template>