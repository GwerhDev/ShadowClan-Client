<style scoped lang="scss" src="./ActionButton.scss" />
<script setup lang="ts">
defineProps({
  action: {
    type: Function,
    required: true
  },
  message: {
    type: String
  },
});

</script>

<template>
  <span class="container" @click="action()">
    {{ message }}
  </span>
</template>