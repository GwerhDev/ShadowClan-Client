<style scoped lang="scss" src="./NavMenuComponent.scss" />
<script setup lang="ts">
import { $d } from '../../functions';

function handleClick() {
  $d('#nav-menu-mobile').style.display = 'none';
};

</script>

<template>
  <span class="nav-menu-container">
    <ul>
      <a class="link-official" href='https://diabloimmortal.blizzard.com/es-es/' target="_blank">
        <img src="../../assets/svg/diablo-icon.svg" alt="">
      </a>
      <router-link class="router-li" to='/' @click="handleClick">
        <li class="nav-button">Inicio</li>
      </router-link>

      <router-link class="router-li" to='/shadow-war' @click="handleClick">
        <li class="nav-button">Guerra Sombría</li>
      </router-link>

      <router-link class="router-li" to='/tasks' @click="handleClick">
        <li class="nav-button">Mis Tareas</li>
      </router-link>
    </ul>
  </span>
</template>
