<script setup lang="ts">
import logo from "../../assets/diabloimmortal-logo.png";
import LoginForm from '../components/Forms/LoginForm.vue';

</script>

<template>
  <div class="page-message-container">
    <img :src="logo" alt="">
    <h1 class="title">ShadowClan</h1>
    <p class="read-the-docs">
      Habla alfombra y entra.
    </p>

    <LoginForm />

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
