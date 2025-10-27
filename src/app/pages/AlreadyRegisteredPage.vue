<script setup lang="ts">
import { API_URL } from '../../middlewares/misc/const';
import BackButton from '../utils/BackButton.vue';

let urlLogin: string = API_URL + "/login-bnet" || "";

</script>

<template>
  <div class="register-message-container">
    <img src="../../assets/diabloimmortal-logo.png" alt="">
    <h1>Ya registrado</h1>
    <p class="read-the-docs">
      El usuario ya se encuentra registrado en nuestra plataforma. 
    </p>

    <a class="button justify-content-center align-items-center d-flex g-1 w-100" :href="urlLogin">
      <img src="../../assets/svg/blizz-icon.svg" alt="" height="25px">
      Iniciar sesión
    </a>

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