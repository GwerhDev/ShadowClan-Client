<style scoped lang="scss" src="./TableComponent.scss"/>
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  navItems: string[];
}>();

const gridColumns = computed(() => {
  return { gridTemplateColumns: `repeat(${props.navItems.length}, 1fr)` };
});
</script>

<template>
  <div class="table-container">
    <nav :style="gridColumns">
      <li v-for="(item, index) in navItems" :key="index">{{ item }}</li>
    </nav>
    <slot></slot>
  </div>
</template>
