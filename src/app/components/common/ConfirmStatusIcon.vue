<script setup lang="ts">
defineProps<{
  status: 'confirmed' | 'declined' | 'pending' | null;
}>();
</script>

<template>
  <i
    v-if="status"
    :class="{
      'fas fa-check-circle confirm-status confirm-status--confirmed': status === 'confirmed',
      'fas fa-times-circle confirm-status confirm-status--declined':  status === 'declined',
      'fas fa-clock        confirm-status confirm-status--pending':   status === 'pending',
    }"
    :title="status === 'confirmed' ? 'Confirmado' : status === 'declined' ? 'Declinado' : 'Pendiente'"
  ></i>
</template>

<style scoped lang="scss">
.confirm-status {
  flex-shrink: 0;
  font-size: 1rem;

  &--confirmed { color: #81c784; }
  &--declined  { color: rgba(229, 115, 115, .8); }
  &--pending   { color: rgba(255, 193, 7, .85); }
}
</style>
