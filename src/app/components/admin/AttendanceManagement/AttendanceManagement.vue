<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route  = useRoute();
const router = useRouter();

const subTabs = [
  { name: 'ManagementAttendanceRegister', label: 'Registrar asistencia', icon: 'fas fa-clipboard-check' },
  { name: 'ManagementAttendanceCycles',   label: 'Ciclos',               icon: 'fas fa-calendar-days' },
];

function isActive(tabName: string) {
  if (tabName === 'ManagementAttendanceCycles') {
    return route.name === 'ManagementAttendanceCycles' || route.name === 'ManagementAttendanceCycleReport';
  }
  return route.name === tabName;
}
</script>

<template>
  <div class="attendance-container">
    <span class="info-text">
      <span class="title">
        <h2>Asistencia a Guerra Sombría</h2>
      </span>
    </span>

    <nav class="attendance-subnav">
      <button
        v-for="tab in subTabs"
        :key="tab.name"
        class="subnav-btn"
        :class="{ active: isActive(tab.name) }"
        @click="router.push({ name: tab.name })"
      >
        <i :class="tab.icon"></i> {{ tab.label }}
      </button>
    </nav>

    <router-view />
  </div>
</template>

<style scoped lang="scss" src="./AttendanceManagement.scss" />
