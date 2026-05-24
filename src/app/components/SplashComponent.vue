<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps<{ done: boolean }>();

const progress = ref(0);
const label = ref('Verificando sesión...');
let ticker: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  ticker = setInterval(() => {
    progress.value += (89 - progress.value) * 0.035;
  }, 50);
});

watch(() => props.done, (isDone) => {
  if (isDone) {
    if (ticker) clearInterval(ticker);
    label.value = 'Listo';
    progress.value = 100;
  }
});

onUnmounted(() => {
  if (ticker) clearInterval(ticker);
});
</script>

<template>
  <main>
    <div class="left-section mw-1250">
      <span class="logo-styles f-size-large">ShadowClan</span>
      <div class="warband pb-2">
        <h3 class="subtitle">Las Sombras reinarán</h3>
      </div>
      <div class="loader-container">
        <span class="loader-label">{{ label }}</span>
        <div class="progress-track">
          <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss" src="./SplashComponent.scss" />
