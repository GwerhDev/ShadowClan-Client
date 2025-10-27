<style scoped lang="scss" src="./AlbumCard.scss"/>
<script setup lang="ts">
import TitleComponent from "../../utils/TitleComponent.vue"

const props: any = defineProps({ album: Object })

</script>

<template>
  <li class="card-container">
    <TitleComponent :title="props.album?.name"/>
  </li>
</template>