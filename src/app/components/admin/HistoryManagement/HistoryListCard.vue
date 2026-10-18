<style scoped lang="scss" src="./HistoryListCard.scss"/>
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { translateResult } from '../../../../helpers/lists';

const props = defineProps<{ war: any }>();

const router = useRouter();

const TYPE_ICON: Record<string, string> = {
  shadow_war:      'fas fa-khanda',
  accursed_tower:  'fas fa-chess-rook',
  vigil_of_blades: 'fas fa-shield-halved',
};
const TYPE_LABEL: Record<string, string> = {
  shadow_war:      'Guerra Sombría',
  accursed_tower:  'Torre Maldita',
  vigil_of_blades: 'Vigilia de Espadas',
};

const formatDate = (dateString: string) => {
  const options: any = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
};

const viewDetails = () => {
  if (props.war.type === 'accursed_tower') {
    router.push(`/management/history/accursed-tower/${props.war._id}`);
  } else if (props.war.type === 'vigil_of_blades') {
    router.push(`/management/history/vigil-of-blades/${props.war._id}`);
  } else {
    router.push(`/management/history/shadow-war/${props.war._id}`);
  }
};
</script>

<template>
  <div class="list-container list-container--clickable" @click="viewDetails">
    <span>
      <span :class="['type-chip', `type-chip--${war.type}`]">
        <i :class="TYPE_ICON[war.type] ?? 'fas fa-khanda'" :title="TYPE_LABEL[war.type]"></i>
      </span>
    </span>
    <span>
      <p class="date-text">{{ formatDate(war.date) }}</p>
    </span>
    <span>
      <p class="enemy-text">{{ war.enemyClan?.name || (war.type === 'vigil_of_blades' ? 'Inmortales' : '—') }}</p>
    </span>
    <span>
      <span v-if="war.result" :class="['result-chip', `result-${war.result}`]">{{ translateResult(war.result) }}</span>
      <span v-else class="result-chip result-pending">—</span>
    </span>
  </div>
</template>
