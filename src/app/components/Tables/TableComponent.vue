<style scoped lang="scss" src="./TableComponent.scss"/>
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  navItems: string[];
  actionsColumn?: boolean;
  gridTemplate?: string;
}>();

const gridColumns = computed(() => {
  return { gridTemplateColumns: props.gridTemplate ?? `repeat(${props.navItems.length}, minmax(80px, 1fr))` };
});
</script>

<template>
  <div class="table-scroll-wrapper">
    <div class="table-container">
      <nav :style="gridColumns">
        <slot name="header">
          <li
            v-for="(item, index) in navItems"
            :key="index"
            :class="{ 'nav-action-cell': actionsColumn && index === navItems.length - 1 }"
          >{{ item }}</li>
        </slot>
      </nav>
      <slot></slot>
    </div>
  </div>
</template>
