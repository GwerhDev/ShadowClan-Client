<script setup lang="ts">
import TitleComponent from '../utils/TitleComponent.vue';
import AlbumList from '../components/Album/AlbumList.vue';

</script>

<template>
  <div class="header-container">
    <div class="header-bg">
      <TitleComponent :title="'Galería'" />
    </div>
  </div>
  <main class="red-shadow-fx">
    <AlbumList />
  </main>
</template>

<style scoped>
</style>

