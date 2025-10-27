<style scoped lang="scss" src="./DeniedAccess.scss"/>
<script setup lang="ts">
import { API_URL } from '../../middlewares/misc/const';

let urlSignup: string = API_URL + "/signup-bnet" || "";
let urlLogin: string = API_URL + "/login-bnet" || "";

</script>

<template>
  <div class="container justify-content-center align-items-center d-flex g-1">
    <h2>Esta función solo está disponible para miembros de un Clan</h2>
    <a class="button justify-content-center align-items-center d-flex g-1 w-100" :href="urlLogin">
      <img src="../../assets/svg/blizz-icon.svg" alt="" height="25px">
      Iniciar sesión
    </a>
    <span>
      ¿No estás registrado?
      <router-link to='/signup' class="justify-content-center align-items-center d-flex g-1 w-100" :href="urlSignup">
        <img src="../../assets/svg/blizz-icon.svg" alt="" height="25px">
        Registrarme
      </router-link>
    </span>
  </div>
</template>