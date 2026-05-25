<style scoped lang="scss" src="./NavMobileComponent.scss" />
<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../../middlewares/store';

defineProps(["loading"]);
const store: any = useStore();

const isLeaderOrOfficer = computed(() => {
  const chars  = store.currentUser?.userData?.character ?? [];
  const active = chars.find((c: any) => c._id === store.currentCharacter) ?? chars[0] ?? null;
  if (!active?.clan) return false;
  const clan   = active.clan;
  const charId = String(active._id);
  return String(clan.leader) === charId ||
    (clan.officer ?? []).some((o: any) => String(o) === charId);
});

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
        <router-link title="Gestión de Clan"
          v-if="isLeaderOrOfficer"
          to="/management" class="nav-item">
          <i class="fas fa-shield-halved"></i>
          <small>Gestión</small>
        </router-link>
      </section>
    </nav>
  </div>
</template>