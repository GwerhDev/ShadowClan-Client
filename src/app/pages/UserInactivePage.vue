<script setup lang="ts">
import BackButton from '../utils/BackButton.vue';

</script>

<template>
  <div class="register-message-container">
    <img src="../../assets/diabloimmortal-logo.png" alt="">
    <h1>Cuenta inactiva</h1>
    <p class="read-the-docs">
      El usuario ha sido banneado por basura. 
    </p>

    <BackButton />

    <p class="read-the-docs">Plataforma para alfombras desarrollada por <a href="https://gwerh.nhexa.cl"
        target="_blank">Gwerh</a>.</p>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}

.button {
  margin-bottom: .5rem;
}

</style>