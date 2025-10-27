<script setup lang="ts">
import AddCharacterModal from '../../components/Settings/AddCharacterModal.vue';
import SettingsComponent from '../../components/Settings/SettingsComponent.vue';

</script>

<template>
  <main class="red-shadow-fx">
    <div class="div-container">
      <SettingsComponent />
      <AddCharacterModal />
    </div>
  </main>
</template>

<style scoped>

.div-container {
  height: 100%;
  padding: 1rem;
  padding-top: 6.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1100px) {
  .div-container {
    padding: 0;
  }
}
</style>
