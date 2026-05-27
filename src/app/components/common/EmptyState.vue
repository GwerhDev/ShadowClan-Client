<script setup lang="ts">
defineProps<{
  icon?: string;
  message: string;
  compact?: boolean;
}>();
</script>

<template>
  <div class="empty-state" :class="{ compact }">
    <i :class="icon ?? 'fas fa-inbox'"></i>
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 60vh;
  color: rgba(255, 255, 255, .2);
  font-size: .9rem;

  i { font-size: 3.5rem; }
  p { margin: 0; }

  &.compact {
    min-height: 30vh;
    padding: 2rem 1rem;
  }
}
</style>
