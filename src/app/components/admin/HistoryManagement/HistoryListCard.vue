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
  router.push(`/management/history/${id}`);
};
</script>

<template>
  <div class="list-container">
    <span>
      <p class="date-text">{{ formatDate(war.date) }}</p>
    </span>
    <span>
      <p class="enemy-text">{{ war.enemyClan?.name || "—" }}</p>
    </span>
    <span>
      <span :class="['result-chip', `result-${war.result}`]">{{ translateResult(war.result) }}</span>
    </span>
    <span class="actions-col">
      <div class="buttons-container">
        <i class="fas fa-eye icon-button" @click="viewDetails(war._id)" title="Ver detalle"></i>
      </div>
    </span>
  </div>
</template>
