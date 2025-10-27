<style scoped lang="scss" src="./HistoryListCard.scss"/>
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { translateResult } from '../../../../helpers/lists';

defineProps(['war']);

const router = useRouter();

const formatDate = (dateString: string) => {
  const options: any = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
};

const viewDetails = (id: string) => {
  router.push(`/dashboard/history/${id}`);
};
</script>

<template>
  <div class="list-container">
    <span>
      <p>{{ formatDate(war.date) }}</p>
    </span>
    <span>
      <p>{{ war.enemyClan?.name || "No definido" }}</p>
    </span>
    <span>
      <p>{{ translateResult(war.result) }}</p>
    </span>
    <span>
      <ul class="buttons-container">
        <i class="fas fa-eye icon-button" @click="viewDetails(war._id)">
        </i>
      </ul>
    </span>
  </div>
</template>