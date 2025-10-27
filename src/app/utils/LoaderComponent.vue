<style scoped lang="scss" src="./LoaderComponent.scss"></style>

<script setup lang="ts">

defineProps(['message']);

</script>

<template>
  <div class="loader-container">
    <div class="loader">
    </div>
    <p v-if="message">{{ message }}</p>
  </div>
</template>


