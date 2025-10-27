<style scoped lang="scss" src="./AccountMobileButton.scss"/>
<script setup lang="ts">
import { $display } from '../../functions';
import LoaderComponent from '../utils/LoaderComponent.vue';

defineProps(["loading"])

function handleButton() {
  $display('#account-menu-mobile');
};

</script>

<template>
  <span class="account-container" @click="handleButton">
    <img src="../../assets/svg/profile-icon.svg" alt="" v-if="!loading">
    <LoaderComponent v-else />
  </span>
</template>