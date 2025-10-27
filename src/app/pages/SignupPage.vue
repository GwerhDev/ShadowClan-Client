<script setup lang="ts">
import SignupForm from '../components/SignupForm.vue';

</script>

<template>
  <div class="register-message-container">
    <img src="../../assets/diabloimmortal-logo.png" alt="">
    <h1 class="title">ShadowClan</h1>
    <p class="read-the-docs">
      Habla alfombra y entra.
    </p>

    <SignupForm />

    <p class="read-the-docs">Plataforma para alfombras desarrollada por <a href="https://gwerh.nhexa.cl"
        target="_blank">Gwerh</a>.</p>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}

.title {
  font-size: 38px;
}

</style>
