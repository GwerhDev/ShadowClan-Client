<style scoped lang="scss" src="./NavComponent.scss" />
<script setup lang="ts">
import { useStore } from '../../middlewares/store';


defineProps(["loading"]);
const store: any = useStore();

</script>

<template>
  <div class="nav-container">
    <nav>
      <div class="section-container">
        <router-link title="Social" to="/" class="nav-item">
          <i class="fas fa-users"></i>
          <small>Social</small>
        </router-link>
        <router-link title="Guerra Sombría" to="/shadow-war" class="nav-item">
          <i class="fas fa-khanda"></i>
          <small>Guerra</small>
        </router-link>
        <router-link title="Torre Maldita" to="/accursed-tower" class="nav-item">
          <i class="fas fa-chess-rook"></i>
          <small>Torre</small>
        </router-link>
        <router-link title="Mis Tareas" to="/tasks" class="nav-item">
          <i class="fas fa-tasks"></i>
          <small>Tareas</small>
        </router-link>
        <router-link title="Dashboard"
          v-if="store.currentUser.userData?.role === 'admin' || store.currentUser.userData?.role === 'clan-leader' || store.currentUser.userData?.role === 'officer'"
          to="/a/dashboard" class="nav-item">
          <i class="fas fa-lock"></i>
          <small>Dashboard</small>
        </router-link>
      </div>
    </nav>
  </div>
</template>