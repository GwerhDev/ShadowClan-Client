<style scoped lang="scss" src="./UserManagement.scss"/>
<script setup lang="ts">
import { useStore } from '../../../../middlewares/store';
import { ref, watch } from 'vue';
import TableComponent from '../../Tables/TableComponent.vue';
import UserListCard from './UserListCard.vue';

const store: any = useStore();
const loading = ref(true);

watch(() => store.currentUser.logged, async (isLoggedIn) => {
  if (isLoggedIn) {
    // Always set loading to true when we start fetching or re-evaluating data
    loading.value = true;
    // Only fetch if users data is not already present or if it's explicitly null/undefined
    if (!store.admin.users) {
      await store.handleGetUsers();
    }
    loading.value = false; // Set loading to false after data is processed
  } else {
    // If not logged in, clear data and set loading to false
    store.admin.users = null;
    loading.value = false;
  }
}, { immediate: true }); // immediate: true to run the watcher immediately on component setup


const navItems = ['estado', 'nombre', 'rol', 'vinculado', 'acciones'];

</script>

<template>
  <div class="ul-container">
    <ul v-if="!loading && store.admin.users">
      <TableComponent :navItems="navItems">
        <li v-for="user in store.admin.users" :key="user._id">
          <UserListCard :user="user"></UserListCard>
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
      </div>
      <div class="skeleton-table-row" v-for="n in 5" :key="n">
        <div class="skeleton-box skeleton-cell"></div>
        <div class="skeleton-box skeleton-cell"></div>
        <div class="skeleton-box skeleton-cell"></div>
        <div class="skeleton-box skeleton-cell"></div>
        <div class="skeleton-box skeleton-cell"></div>
      </div>
    </div>
    <p v-else>No hay usuarios disponibles.</p>
  </div>
</template>
