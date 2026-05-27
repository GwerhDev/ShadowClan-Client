<script setup lang="ts">
import { ref } from 'vue';
import CreateShadowWarForm from './CreateShadowWarForm.vue';
import PublishModal from './PublishModal.vue';

const showPublishModal = ref(false);

defineProps<{
  nextWarDate?: string;
}>();
</script>

<template>
  <div class="shadow-war-container">
    <span class="info-text">
      <span class="title">
        <h2>Próxima Batalla</h2>
      </span>
      <p>La próxima <b>Guerra Sombría</b> es el <i>{{ nextWarDate }} a las
          19:30h (hora del servidor)</i>.</p>
    </span>

    <CreateShadowWarForm @publish="showPublishModal = true" />

    <PublishModal v-if="showPublishModal" @close="showPublishModal = false" />
  </div>
</template>

<style scoped lang="scss" src="./ShadowWar.scss" />
