<style scoped lang="scss" src="./NavMobileComponent.scss" />
<script setup lang="ts">

defineProps(["loading"]);

</script>

<template>
  <div class="nav-container">
    <nav class="nav-web">
      <div class="section-container">
        <router-link to="/" class="nav-item">
          <i class="fas fa-home"></i>
          <small>Inicio</small>
        </router-link>
        <router-link to="/shadow-war" class="nav-item">
          <i class="fas fa-khanda"></i>
          <small>Guerra de Sombras</small>
        </router-link>
        <router-link to="/tasks" class="nav-item">
          <i class="fas fa-tasks"></i>
          <small>Mis Tareas</small>
        </router-link>
        <router-link to="/u/settings" class="nav-item">
          <i class="fas fa-user"></i>
          <small>Cuenta</small>
        </router-link>
      </div>
    </nav>
  </div>
</template>