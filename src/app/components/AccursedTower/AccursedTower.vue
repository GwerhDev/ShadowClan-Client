<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../../../middlewares/store';

const store: any = useStore();

defineProps({
  activeTab: {
    type: Object as () => { value: string; label: string },
    required: true
  },
  loading: {
    type: Boolean,
    required: true
  }
});

const error = computed(() => store.currentUser.shadowWarError);
</script>

<template>
  <div class="public-next-battle">
    <div v-if="error">
      <p>Ha ocurrido un error:</p>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./AccursedTower.scss" />
