<script setup lang="ts">
import diabloImg from "../../../assets/svg/diablo-icon.svg";

defineProps({
  title: {
    type: String,
    required: true,
  },
});
defineEmits(['close']);
</script>

<template>
  <div class="container-modal-component" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <img :src="diabloImg" alt="">
        <h2>{{ title }}</h2>
        <button @click="$emit('close')" class="close-button">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./CustomModal.scss" />