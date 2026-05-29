<script setup lang="ts">
import { computed } from 'vue';
import { classes } from '../../../middlewares/misc/const';

const props = defineProps<{
  currentClass?: string;
  size?: number;
}>();

const src = computed(() =>
  classes.find(c => c.value === props.currentClass)?.image ?? ''
);

const px = computed(() => `${props.size ?? 38}px`);
</script>

<template>
  <img
    v-if="src"
    :src="src"
    :alt="currentClass"
    class="class-img"
  />
  <div v-else class="class-img class-img--fallback">
    <i class="fas fa-question"></i>
  </div>
</template>

<style scoped lang="scss">
.class-img {
  width: v-bind(px);
  height: v-bind(px);
  flex-shrink: 0;
  object-fit: contain;

  &--fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, .06);
    border-radius: 6px;
    color: rgba(255, 255, 255, .3);
    font-size: calc(v-bind(px) * 0.55);
  }
}
</style>
