<script setup lang="ts">
import Auth from "../components/AuthComponent.vue";
</script>

<template>
  <main>
    <div class="container">
      <Suspense>
        <Auth />
      </Suspense>
    </div>
  </main>
</template>