<script setup lang="ts">
import CustomModal from './CustomModal.vue';

const emit = defineEmits(['close']);

</script>

<template>
  <CustomModal title="¿Deseas cerrar sesión?" @close="$emit('close')">
  </CustomModal>
</template>
