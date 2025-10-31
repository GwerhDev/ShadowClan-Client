<script setup lang="ts">
import CustomModal from './CustomModal.vue';

const emit = defineEmits(['close']);

</script>

<template>
  <CustomModal title="¿Deseas eliminar tu cuenta?" @close="$emit('close')">
  </CustomModal>
</template>
