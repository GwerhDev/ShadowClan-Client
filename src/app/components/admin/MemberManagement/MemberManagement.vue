<style scoped lang="scss" src="./MemberManagement.scss"/>
<script setup lang="ts">
import { useStore } from '../../../../middlewares/store';
import { onMounted, ref, watch } from 'vue';
import TableComponent from '../../Tables/TableComponent.vue';
import MemberListCard from './MemberListCard.vue';
import AddMemberModal from './AddMemberModal.vue';

const store: any = useStore();
const showModal = ref(false);
const loading = ref(true); // New ref for loading state

onMounted(() => {
  // Data fetching is now handled by the watch effect
});

watch(() => store.currentUser.logged, async (isLoggedIn) => {
  if (isLoggedIn) {
    // Always set loading to true when we start fetching or re-evaluating data
    loading.value = true;
    // Only fetch if members data is not already present or if it's explicitly null/undefined
    if (!store.admin.members) {
      await store.handleGetMembers();
    }
    loading.value = false; // Set loading to false after data is processed
  } else {
    // If not logged in, clear data and set loading to false
    store.admin.members = null;
    loading.value = false;
  }
}, { immediate: true }); // immediate: true to run the watcher immediately on component setup

function handleAddMember() {
  showModal.value = true;
};

const navItems = ['#', 'personaje', 'resonancia', 'clase', 'whatsapp', 'acciones'];

</script>

<template>
  <div class="ul-container">
    <span class="button-list">
      <button @click="handleAddMember">Agregar miembro</button>
    </span>
    <ul v-if="!loading && store.admin.members">
      <TableComponent :navItems="navItems">
        <li v-for="member in store.admin.members" :key="member._id">
          <MemberListCard :member="member"></MemberListCard>
        </li>
      </TableComponent>
    </ul>
    <div v-else-if="loading" class="skeleton-table-container">
      <div class="skeleton-table-header">
        <div class="skeleton-box skeleton-header-item"></div>
        <div class="skeleton-box skeleton-header-item"></div>
        <div class="skeleton-box skeleton-header-item"></div>
        <div class="skeleton-box skeleton-header-item"></div>
        <div class="skeleton-box skeleton-header-item"></div>
        <div class="skeleton-box skeleton-header-item"></div>
        <div class="skeleton-box skeleton-header-item"></div>
      </div>
      <div class="skeleton-table-row" v-for="n in 5" :key="n">
        <div class="skeleton-box skeleton-cell"></div>
        <div class="skeleton-box skeleton-cell"></div>
        <div class="skeleton-box skeleton-cell"></div>
        <div class="skeleton-box skeleton-cell"></div>
        <div class="skeleton-box skeleton-cell"></div>
        <div class="skeleton-box skeleton-cell"></div>
        <div class="skeleton-box skeleton-cell"></div>
      </div>
    </div>
    <p v-else>No hay miembros disponibles.</p>

    <AddMemberModal v-if="showModal" @close="showModal = false" />
  </div>
</template>