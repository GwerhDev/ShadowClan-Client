<template>
  <AccursedTower :activeTab="{ value: 'famed', label: 'Célebre' }" :loading="loading" />
</template>

<script setup lang="ts">
import AccursedTower from './AccursedTower.vue';

defineProps({
  loading: {
    type: Boolean,
    required: true
  }
});
</script>