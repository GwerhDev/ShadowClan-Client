<script setup lang="ts">
import AppLayout from '../layouts/AppLayout.vue';
import ClanRequestsComponent from '../components/ClanRequests/ClanRequestsComponent.vue';
</script>

<template>
  <main class="red-shadow-fx">
    <div class="div-container">
      <AppLayout :tabs="[]">
        <ClanRequestsComponent />
      </AppLayout>
    </div>
  </main>
</template>

<style scoped>
.div-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1100px) {
  .div-container { padding: 0; }
}
</style>
