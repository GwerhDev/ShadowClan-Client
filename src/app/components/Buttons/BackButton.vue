<script setup lang="ts">
import { useRouter } from 'vue-router';

const router: any = useRouter();

function handleBackButton() {
  router.push('/');
};

</script>

<template>
  <button class="back-button" @click="handleBackButton">Volver al inicio</button>
</template>

<style scoped lang="scss" src="./BackButton.scss"/>
