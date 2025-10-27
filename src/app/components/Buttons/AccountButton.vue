<style scoped lang="scss" src="./AccountButton.scss"/>
<script setup lang="ts">
import { useStore } from '../../../middlewares/store';
import { $display } from '../../../functions';
import LoaderComponent from '../../utils/LoaderComponent.vue';

defineProps(["loading"]);

const store: any = useStore();

function handleButton() {
  $display("#user-menu-container");
};

</script>

<template>
  <span class="account-container">
    <button class="nav-button" @click="handleButton" v-if="!loading">
      <span></span>
      <img src="../../../assets/svg/profile-icon.svg" alt="">
      <p>{{ store.currentUser?.userData?.username || "Cuenta" }}</p>
      <img src="../../../assets/svg/open-menu-icon.svg" alt="" width="12px">
    </button>
    <button class="nav-button" @click="handleButton" v-else disabled>
      <LoaderComponent />
    </button>
  </span>
</template>