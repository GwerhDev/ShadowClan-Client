<style scoped lang="scss" src="./HistoryListCard.scss"/>
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { translateResult } from '../../../../helpers/lists';

const props = defineProps<{ war: any }>();

const router = useRouter();

const formatDate = (dateString: string) => {
  const options: any = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
};

const viewDetails = () => {
  if (props.war.type === 'accursed_tower') {
    router.push(`/management/history/tower/${props.war._id}`);
  } else {
    router.push(`/management/history/${props.war._id}`);
  }
};
</script>

<template>
  <div class="list-container">
    <span>
      <span :class="['type-chip', `type-chip--${war.type}`]">
        <i :class="war.type === 'accursed_tower' ? 'fas fa-chess-rook' : 'fas fa-khanda'"></i>
      </span>
    </span>
    <span>
      <p class="date-text">{{ formatDate(war.date) }}</p>
    </span>
    <span>
      <p class="enemy-text">{{ war.enemyClan?.name || "—" }}</p>
    </span>
    <span>
      <span v-if="war.result" :class="['result-chip', `result-${war.result}`]">{{ translateResult(war.result) }}</span>
      <span v-else class="result-chip result-pending">—</span>
    </span>
    <span class="actions-col">
      <div class="buttons-container">
        <button class="icon-button" @click="viewDetails" title="Ver detalle">
          <i class="fas fa-eye"></i>
        </button>
      </div>
    </span>
  </div>
</template>
