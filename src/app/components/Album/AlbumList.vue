<style scoped lang="scss" src="./AlbumList.scss"/>
<script setup lang="ts">
import AlbumCard from "./AlbumCard.vue"

const albumList = [
  { name: "Miembros" },
  { name: "Memes" }
]

</script>

<template>
    <div class="container-ext">
    <ul class="album-container">
      <AlbumCard v-for="item in albumList" :album="item"></AlbumCard>
    </ul>
  </div>
</template>