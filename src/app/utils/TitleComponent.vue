<style scoped lang="scss" src="./TitleComponent.scss"></style>

<script setup lang="ts">
import diabloIcon from "../../assets/svg/diablo-icon.svg";

defineProps(['title', 'icon']);


</script>

<template>
  <span class="section-title">
    <div class="title-container">
      <span>
        <img :src="icon || diabloIcon" alt="icon"/>
      </span>
      <h1>{{ title }}</h1>
    </div>
  </span>
</template>


