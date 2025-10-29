<template>
  <ShadowWar :activeTab="{ value: 'proud', label: 'Imponente' }" :loading="loading" />
</template>

<script setup lang="ts">
import ShadowWar from './ShadowWar.vue';

defineProps({
  loading: {
    type: Boolean,
    required: true
  }
});
</script>