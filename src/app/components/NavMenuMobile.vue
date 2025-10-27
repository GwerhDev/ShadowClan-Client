<style scoped lang="scss" src="./NavMenuMobile.scss"/>
<script setup lang="ts">
import { $d, $display } from '../../functions';
import NavMenuComponent from './NavMenuComponent.vue';

function handleButton() {
  $display("#nav-menu-mobile");
};

document.addEventListener('mouseup', function (e) {
  const container = $d('#nav-menu-mobile');
  if (!container?.contains(e.target)) {
    return (
      $d('#nav-menu-mobile').style.display = 'none'
    )
  };
  return;
});

</script>

<template>
  <div class="nav-menu" id="nav-menu-mobile">
    <div class="top-menu">
      <span @click="handleButton">
        <img src="../../assets/svg/close-icon.svg" alt="" height="25px" />
      </span>
      <p class="logo-styles canvas-logo">ShadowClan</p>
      <div></div>
    </div>
    <img class="menu-logo" src="../../assets/avif/di-logo-960.avif" alt="">
    <NavMenuComponent />
  </div>

</template>