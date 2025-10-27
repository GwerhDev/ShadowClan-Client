<template>
  <PublicShadowWar :activeTab="{ value: 'proud', label: 'Imponente' }" :loading="loading" />
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