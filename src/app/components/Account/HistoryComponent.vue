<style scoped lang="scss" src="./ClanComponent.scss" />
<script setup lang="ts">
import { useStore } from '../../../middlewares/store';
import { onMounted } from 'vue';

const store: any = useStore();

onMounted(async () => {
  await store.handleGetCharacter();
});

</script>

<template>
  <div class="container-settings-component">
    <div class="settings-container">
      <span class="mb-3 mt-1">
        <ul class="d-flex col g-1">
          <h3 class="mb-1">Historial</h3>
        </ul>
      </span>
    </div>
  </div>
</template>