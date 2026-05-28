<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import shadowclanIcon from '../../assets/png/shadowclan-icon.png';

const props = defineProps<{ done: boolean }>();

const progress = ref(0);
const label    = ref('Verificando sesión...');
let ticker: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  ticker = setInterval(() => {
    progress.value += (89 - progress.value) * 0.035;
  }, 50);
});

watch(() => props.done, (isDone) => {
  if (isDone) {
    if (ticker) clearInterval(ticker);
    label.value    = 'Listo';
    progress.value = 100;
  }
});

onUnmounted(() => {
  if (ticker) clearInterval(ticker);
});
</script>

<template>
  <main class="splash">
    <div class="splash-content">
      <div class="splash-logo-wrap">
        <img :src="shadowclanIcon" alt="ShadowClan" class="splash-logo" />
        <div class="splash-glow" />
      </div>

      <div class="splash-brand">
        <span class="splash-name">ShadowClan</span>
        <span class="splash-tagline">Las sombras reinarán</span>
      </div>

      <div class="splash-loader">
        <span class="splash-label">{{ label }}</span>
        <div class="progress-track">
          <div class="progress-bar" :style="{ width: progress + '%' }" />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.splash {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url(../../assets/png/di-bg-splash.png);
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;

  // Dark overlay to keep it readable
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, .55);
  }
}

.splash-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

// ── Logo ──────────────────────────────────────────────────────────────────────

.splash-logo-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.splash-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 0 24px rgba(200, 60, 0, .5));
  animation: logo-pulse 3s ease-in-out infinite;
}

.splash-glow {
  position: absolute;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(180, 40, 0, .25) 0%, transparent 70%);
  animation: glow-pulse 3s ease-in-out infinite;
}

// ── Brand ─────────────────────────────────────────────────────────────────────

.splash-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .35rem;
}

.splash-name {
  font-family: Diablo, 'Cinzel', serif;
  font-size: 2.5rem;
  letter-spacing: .06em;
  color: rgb(227, 210, 168);
  filter: drop-shadow(0 0 12px rgba(255, 0, 0, .3));
  display: inline-block;
  transform: scale(1, 1.4);
  line-height: 1;
}

.splash-tagline {
  font-family: 'Cinzel', serif;
  font-size: .72rem;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: rgba(227, 210, 168, .45);
}

// ── Loader ────────────────────────────────────────────────────────────────────

.splash-loader {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: .5rem;
  margin-top: .5rem;
}

.splash-label {
  font-family: 'Cinzel', serif;
  font-size: .65rem;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: rgba(227, 210, 168, .45);
  text-align: center;
}

.progress-track {
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, .08);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #7b2917, rgb(227, 210, 168));
  box-shadow: 0 0 8px rgba(255, 60, 0, .5);
  transition: width .15s ease-out;
}

// ── Animations ────────────────────────────────────────────────────────────────

@keyframes logo-pulse {
  0%, 100% { filter: drop-shadow(0 0 24px rgba(200, 60, 0, .5)); transform: scale(1); }
  50%       { filter: drop-shadow(0 0 36px rgba(200, 60, 0, .75)); transform: scale(1.04); }
}

@keyframes glow-pulse {
  0%, 100% { opacity: .6; transform: scale(1); }
  50%       { opacity: 1;  transform: scale(1.15); }
}
</style>
