<script setup lang="ts">
import { ref } from 'vue';
import CreateShadowWarForm from './CreateShadowWarForm.vue';
import PublishModal from './PublishModal.vue';

const showPublishModal = ref(false);
</script>

<template>
  <div class="shadow-war-container">
    <span class="info-text">
      <span class="title">
        <h2>Prepárate para la batalla</h2>
      </span>
    </span>
    <CreateShadowWarForm @publish="showPublishModal = true" />
    <PublishModal v-if="showPublishModal" @close="showPublishModal = false" />
  </div>
</template>

<style scoped lang="scss" src="./ShadowWar.scss" />
