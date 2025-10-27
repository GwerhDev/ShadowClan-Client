<style scoped lang="scss" src="./NavMobileComponent.scss"/>
<script setup lang="ts">
import LogoComponent from './LogoComponent.vue';
import BurgerMenu from './BurgerMenuComponent.vue';
import UserMenuComponent from './UserMenuComponent.vue';
import AccountMobileButton from './AccountMobileButton.vue';

defineProps(["loading"]);

</script>

<template>
  <nav class="nav-mobile">
    <div class="section-container">
      <BurgerMenu />
      <LogoComponent />
      <AccountMobileButton :loading="loading" />
    </div>
    <UserMenuComponent />
  </nav>
</template>