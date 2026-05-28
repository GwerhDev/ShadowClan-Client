<script setup lang="ts">
defineProps<{
  status: 'confirmed' | 'pending' | null;
}>();
</script>

<template>
  <i
    v-if="status"
    :class="status === 'confirmed'
      ? 'fas fa-check-circle confirm-status confirm-status--confirmed'
      : 'fas fa-clock confirm-status confirm-status--pending'"
    :title="status === 'confirmed' ? 'Confirmado' : 'Pendiente'"
  ></i>
</template>

<style scoped lang="scss">
.confirm-status {
  flex-shrink: 0;
  font-size: 1rem;

  &--confirmed { color: #81c784; }
  &--pending   { color: rgba(255, 193, 7, .85); }
}
</style>
