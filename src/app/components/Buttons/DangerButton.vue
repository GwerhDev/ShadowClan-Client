<script setup lang="ts">

defineProps({
  text: String,
});

const handleClick: () => void = () => {

};

</script>

<template>
  <button class="danger-button" @click="handleClick">
    {{ text }}
  </button>
</template>

<style scoped lang="scss" src="./DangerButton.scss" />
