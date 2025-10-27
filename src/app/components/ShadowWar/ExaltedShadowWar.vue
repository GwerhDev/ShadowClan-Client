<template>
  <PublicShadowWar :activeTab="{ value: 'exalted', label: 'Sublime' }" :loading="loading" />
</template>

<script setup lang="ts">
import PublicShadowWar from './PublicShadowWar.vue';

defineProps({
  loading: {
    type: Boolean,
    required: true
  }
});
</script>