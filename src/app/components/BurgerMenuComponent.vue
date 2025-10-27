<style scoped lang="scss" src="./BurgerMenuComponent.scss"/>
<script setup lang="ts">
import { $display } from '../../functions';

function handleButton() {
  $display("#nav-menu-mobile");
};

</script>

<template>
  <span class="burger-container" @click="handleButton">
    <img src="../../assets/svg/burger-icon.svg" alt="" />
  </span>
</template>