<style scoped lang="scss" src="./NavComponent.scss" />
<script setup lang="ts">

defineProps(["loading"]);

</script>

<template>
  <div class="nav-container">
    <nav class="nav-web">
      <div class="section-container">
        <router-link to="/" class="nav-item">
          <i class="fas fa-user"></i>
          <small>Cuenta</small>
        </router-link>
        <router-link to="/shadow-war" class="nav-item">
          <i class="fas fa-khanda"></i>
          <small>Guerra</small>
        </router-link>
        <router-link to="/accursed-tower" class="nav-item">
          <i class="fas fa-chess-rook"></i>
          <small>Torre</small>
        </router-link>
        <router-link to="/tasks" class="nav-item">
          <i class="fas fa-tasks"></i>
          <small>Mis Tareas</small>
        </router-link>
      </div>
    </nav>
  </div>
</template>