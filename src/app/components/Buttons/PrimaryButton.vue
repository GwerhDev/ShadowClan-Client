<style scoped lang="scss" src="./PrimaryButton.scss" />
<script setup lang="ts">
defineProps({
  onclick: {
    type: Function,
    required: true
  },
  text: {
    type: String
  },
});

</script>

<template>
  <button class="primary-button" @click="onclick()">
    {{ text }}
  </button>
</template>