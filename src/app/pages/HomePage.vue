<script setup lang="ts">
import { useRouter } from 'vue-router';
import ActionButton from '../components/Buttons/ActionButton.vue';

const router = useRouter();

function apply() {
  router.push('/login');
}

</script>

<template>
  <main>
    <div class="left-section mw-1250">
      <span class="logo-styles f-size-large">ShadowClan</span>
      <div class="warband pb-2">
        <h3 class="subtitle">Las Sombras reinarán</h3>
      </div>
      <ActionButton message="Ingresar" :action="apply" />
    </div>
  </main>
</template>

<style scoped>
main {
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  width: 100vw;
  min-height: 100vh;
  overflow-x: hidden;
  background-size: cover;
  background-position: top;
  background-repeat: no-repeat;
  background-image: url(../../assets/avif/background.avif);
  display: flex;
  justify-content: center;
  align-items: center;
}

.left-section {
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
}

.right-section {
  width: 100%;
  aspect-ratio: 16/9;
}

.warband {
  text-align: center;
  max-width: 500px;
  margin-top: 1rem;
}

.di-logo {
  width: 500px;
}

.subtitle {
  color: antiquewhite;
  font-weight: 400;
}

@media (max-width: 1100px) {
  .first-section {
    align-items: center;
    flex-direction: column;
  }

  .left-section {
    justify-content: center;
  }

  .right-section {
    display: none;
  }

  .di-logo {
    max-width: 420px;
  }

  .left-section {
    width: 100%;
    max-width: 400px;
  }

  .subtitle {
    font-size: 15px;
  }
}
</style>
