<script setup lang="ts">
import CustomModal from '../Modals/CustomModal.vue';
import LinkCharacterForm from '../Walker/LinkCharacterForm.vue';

defineEmits(['close']);
</script>

<template>
  <CustomModal title="Vincular personaje" @close="$emit('close')">
    <LinkCharacterForm @done="$emit('close')" @cancel="$emit('close')" />
  </CustomModal>
</template>
