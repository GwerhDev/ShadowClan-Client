<script setup lang="ts">
import { ref, Ref } from 'vue';
import CreateShadowWarForm from './CreateShadowWarForm.vue';

defineProps({
  openShareModal: {
    type: Function,
    required: true,
  },
  nextWarDate: {
    type: String,
    required: true,
  },
});

const error: Ref<string | null> = ref(null);

</script>

<template>
  <div class="shadow-war-container">
    <span class="info-text">
      <span class="title">
      <h2>Próxima Batalla</h2>
        <i @click="openShareModal()" class="fas fa-share"></i>
      </span>
      <p>La próxima <b>Guerra Sombría</b> es el <i>{{ nextWarDate }} a las
          19:30h (hora del servidor)</i>.</p>
      <div v-if="error">
        <p>Ha ocurrido un error:</p>
        <pre>{{ error }}</pre>
      </div>
      <div class="button-container">
        <span class="copied-feedback"></span>
      </div>
    </span>

    <CreateShadowWarForm />
  </div>
</template>

<style scoped lang="scss" src="./ShadowWar.scss" />