<style scoped lang="scss" src="./NavMobileComponent.scss" />
<script setup lang="ts">
import { useStore } from '../../middlewares/store';

defineProps(["loading"]);
const store: any = useStore();

</script>

<template>
  <div class="nav-container">
    <nav>
      <section class="router-section">
        <router-link title="Inicio" to="/" class="nav-item">
          <i class="fas fa-home"></i>
          <small>Inicio</small>
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
          v-if="store.currentUser?.userData?.role === 'admin' || store.currentUser?.userData?.role === 'super_admin'"
          to="/a/dashboard" class="nav-item">
          <i class="fas fa-lock"></i>
          <small>Dashboard</small>
        </router-link>
      </section>
    </nav>
  </div>
</template>