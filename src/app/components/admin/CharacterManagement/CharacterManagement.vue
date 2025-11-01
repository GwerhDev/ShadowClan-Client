<style scoped lang="scss" src="./CharacterManagement.scss"/>
<script setup lang="ts">
import { useStore } from '../../../../middlewares/store';
import { onMounted, ref, watch } from 'vue';
import TableComponent from '../../Tables/TableComponent.vue';
import CharacterListCard from './CharacterListCard.vue';
import AddCharacterModal from './AddCharacterModal.vue';

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
    // Only fetch if characters data is not already present or if it's explicitly null/undefined
    if (!store.admin.characters) {
      await store.handleGetMembers();
    }
    loading.value = false; // Set loading to false after data is processed
  } else {
    // If not logged in, clear data and set loading to false
    store.admin.characters = null;
    loading.value = false;
  }
}, { immediate: true }); // immediate: true to run the watcher immediately on component setup

function handleAddMember() {
  showModal.value = true;
};

const navItems = ['#', 'personaje', 'resonancia', 'clase', 'acciones'];

</script>

<template>
  <div class="ul-container">
    <span class="button-list">
      <button @click="handleAddMember">Agregar miembro</button>
    </span>
    <ul v-if="!loading && store.admin.characters">
      <TableComponent :navItems="navItems">
        <li v-for="character in store.admin.characters" :key="character._id">
          <CharacterListCard :character="character"></CharacterListCard>
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

    <AddCharacterModal v-if="showModal" @close="showModal = false" />
  </div>
</template>