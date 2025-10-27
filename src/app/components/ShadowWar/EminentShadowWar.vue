<template>
  <PublicShadowWar :activeTab="{ value: 'eminent', label: 'Eminente' }" :loading="loading" />
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