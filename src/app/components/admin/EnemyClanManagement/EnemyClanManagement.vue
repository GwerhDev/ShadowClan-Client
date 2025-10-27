<style scoped lang="scss" src="./EnemyClanManagement.scss" />
<script setup lang="ts">
import { useStore } from '../../../../middlewares/store';
import { computed, onMounted, ref } from 'vue';
import TableComponent from '../../Tables/TableComponent.vue';
import EnemyClanListCard from './EnemyClanListCard.vue';
import AddEnemyClanModal from './AddEnemyClanModal.vue';

const store: any = useStore();
const showModal = ref(false);
const loading = ref(true);

const clans = computed(() => store.admin.clans);

function handleAddClan() {
  showModal.value = true;
};

onMounted(async () => {
  await store.handleGetClans();
  loading.value = false;
});

const navItems = ['nombre', 'status', 'members', 'acciones'];

</script>

<template>
  <div class="ul-container">
    <span class="button-list">
      <button @click="handleAddClan">Agregar clan</button>
    </span>
    <ul v-if="!loading && clans">
      <TableComponent :navItems="navItems">
        <li v-for="clan in clans" :key="clan._id">
          <EnemyClanListCard :clan="clan"></EnemyClanListCard>
        </li>
      </TableComponent>
    </ul>
    <div v-else-if="loading" class="skeleton-table-container">
      <div class="skeleton-table-header">
        <div class="skeleton-box skeleton-header-item"></div>
        <div class="skeleton-box skeleton-header-item"></div>
      </div>
      <div class="skeleton-table-row" v-for="n in 5" :key="n">
        <div class="skeleton-box skeleton-cell"></div>
        <div class="skeleton-box skeleton-cell"></div>
      </div>
    </div>
    <p v-else>No hay clanes disponibles.</p>

    <AddEnemyClanModal v-if="showModal" @close="showModal = false" />
  </div>
</template>
