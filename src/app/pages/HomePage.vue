<script setup lang="ts">
import { useRouter } from 'vue-router';
import ActionButton from '../components/Buttons/ActionButton.vue';

const router = useRouter();

function apply() {
  router.push('/shadow-war');
}

</script>

<template>
  <main>
    <section class="first-section">
      <div class="left-section mw-1250">
        <span class="logo-styles f-size-large">ShadowClan</span>
        <div class="warband pb-2">
          <h3 class="subtitle">Las Sombras reinarán</h3>
        </div>
        <ActionButton message="Ir a Guerra Sombría" :action="apply"/>
      </div>
      <div class="right-section mw-1250"></div>
    </section>
  </main>
</template>

<style scoped>
main {
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100vh;
  overflow-x: hidden;
  background-size: cover;
  background-position: top;
  background-repeat: no-repeat;
  background-image: url(../../assets/avif/background.avif);
}

.first-section {
  height: 100vh;
  min-height: 800px;
  padding-left: 1.1rem;
  padding-right: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, transparent 1%, black 90%);
}

.second-section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-left: 1.1rem;
  padding-right: 1.1rem;
  background: linear-gradient(to bottom, black 20%, var(--color-secondary-bg) 100%);
}

.third-section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-left: 1.1rem;
  padding-right: 1.1rem;
  background: linear-gradient(to bottom, var(--color-secondary-bg) 30%, var(--color-red-action) 300%);
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
